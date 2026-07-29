import { dbStore } from './store-db';
import { MonthlyAccrualLog, Employee } from '@/types';
import { AuditService } from './audit-service';
import { NotificationService } from '@/lib/services/notification-service';

export class AccrualService {
  static async getLogs(filter?: { employeeId?: string; month?: number; year?: number }): Promise<MonthlyAccrualLog[]> {
    return dbStore.getMonthlyAccrualLogs(filter);
  }

  static async previewMonthlyAccrual(month: number, year: number) {
    const settings = await dbStore.getSystemSettings();
    const employees = await dbStore.getEmployees();
    const activeEmployees = employees.filter(e => e.isActive && e.employmentStatus === 'Active');
    const existingLogs = await dbStore.getMonthlyAccrualLogs({ month, year });
    const processedEmpIds = new Set(existingLogs.map(l => l.employeeId));

    const previewItems = activeEmployees.map(emp => {
      const isAlreadyProcessed = processedEmpIds.has(emp.id);
      return {
        employee: emp,
        vacationCredited: settings.monthlyVacationLeave,
        sickCredited: settings.monthlySickLeave,
        status: isAlreadyProcessed ? ('Already Processed' as const) : ('Pending Accrual' as const),
      };
    });

    const isMonthFullyProcessed = activeEmployees.length > 0 && activeEmployees.every(e => processedEmpIds.has(e.id));

    return {
      month,
      year,
      settings,
      totalActiveEmployees: activeEmployees.length,
      alreadyProcessedCount: processedEmpIds.size,
      isMonthFullyProcessed,
      items: previewItems,
    };
  }

  static async executeMonthlyAccrual(month: number, year: number, processedBy: string = 'Admin Engine') {
    const settings = await dbStore.getSystemSettings();
    const employees = await dbStore.getEmployees();
    const activeEmployees = employees.filter(e => e.isActive && e.employmentStatus === 'Active');
    const leaveTypes = await dbStore.getLeaveTypes();

    const vlType = leaveTypes.find(lt => lt.code === 'VL') || leaveTypes[0];
    const slType = leaveTypes.find(lt => lt.code === 'SL') || leaveTypes[1];

    const existingLogs = await dbStore.getMonthlyAccrualLogs({ month, year });
    const processedEmpIds = new Set(existingLogs.map(l => l.employeeId));

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthLabel = `${monthNames[month - 1]} ${year}`;

    let successCount = 0;
    let skippedCount = 0;
    const results = [];

    for (const emp of activeEmployees) {
      if (processedEmpIds.has(emp.id)) {
        skippedCount++;
        results.push({ employeeId: emp.id, name: `${emp.firstName} ${emp.lastName}`, status: 'Skipped (Already Processed)' });
        continue;
      }

      try {
        // 1. Credit Vacation Leave
        if (settings.monthlyVacationLeave > 0) {
          await dbStore.executeLeaveTransaction({
            employeeId: emp.id,
            leaveTypeId: vlType.id,
            transactionType: 'Credit',
            source: 'Monthly Accrual',
            amount: settings.monthlyVacationLeave,
            referenceId: `REF-ACCRUAL-${year}-${month}-${emp.employeeNumber}`,
            remarks: `Automatic monthly vacation leave credit accrual for ${monthLabel}`,
            createdBy: processedBy,
          });
        }

        // 2. Credit Sick Leave
        if (settings.monthlySickLeave > 0) {
          await dbStore.executeLeaveTransaction({
            employeeId: emp.id,
            leaveTypeId: slType.id,
            transactionType: 'Credit',
            source: 'Monthly Accrual',
            amount: settings.monthlySickLeave,
            referenceId: `REF-ACCRUAL-${year}-${month}-${emp.employeeNumber}`,
            remarks: `Automatic monthly sick leave credit accrual for ${monthLabel}`,
            createdBy: processedBy,
          });
        }

        // 3. Record Accrual Log
        await dbStore.createMonthlyAccrualLog({
          employeeId: emp.id,
          month,
          year,
          vacationCredited: settings.monthlyVacationLeave,
          sickCredited: settings.monthlySickLeave,
          processedBy,
          status: 'Success',
        });

        // 4. Notify Employee
        const userList = await dbStore.getUsers();
        const userObj = userList.find(u => u.employeeId === emp.id);
        if (userObj) {
          await NotificationService.create({
            userId: userObj.id,
            title: `Monthly Leave Credits Earned (${monthLabel})`,
            message: `Your monthly leave credits for ${monthLabel} (+${settings.monthlyVacationLeave} VL, +${settings.monthlySickLeave} SL) have been added to your balance.`,
            type: 'Monthly Accrual',
            link: '/dashboard/leave-ledger',
          });
        }

        successCount++;
        results.push({ employeeId: emp.id, name: `${emp.firstName} ${emp.lastName}`, status: 'Success' });
      } catch (err: any) {
        results.push({ employeeId: emp.id, name: `${emp.firstName} ${emp.lastName}`, status: `Failed: ${err.message}` });
      }
    }

    // Audit Log for the batch run
    await AuditService.log({
      userId: 'user_admin',
      action: 'EXECUTE_MONTHLY_LEAVE_ACCRUAL',
      module: 'Monthly Accrual Engine',
      recordId: `ACCRUAL-${year}-${month}`,
      newValue: { month, year, successCount, skippedCount, totalActive: activeEmployees.length },
    });

    return {
      month,
      year,
      monthLabel,
      totalActive: activeEmployees.length,
      successCount,
      skippedCount,
      results,
    };
  }
}
