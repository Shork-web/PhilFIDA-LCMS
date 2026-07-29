import { dbStore } from './store-db';
import { Employee, ImportSummary } from '@/types';
import { AuditService } from './audit-service';

export interface ImportEmployeeRow {
  employeeNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  email: string;
  contactNumber?: string;
  office?: string;
  division?: string;
  position?: string;
  appointmentType?: string;
  appointmentDate?: string;
  beginningVL?: number;
  beginningSL?: number;
  beginningCTO?: number;
}

export class ImportService {
  static async parseAndValidateCSV(csvText: string) {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      throw new Error('CSV file is empty or missing headers');
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    const existingEmployees = await dbStore.getEmployees();
    const existingNumbers = new Set(existingEmployees.map(e => e.employeeNumber.toLowerCase()));
    const existingEmails = new Set(existingEmployees.map(e => e.email.toLowerCase()));

    const parsedRows: ImportEmployeeRow[] = [];
    const errors: Array<{ row: number; field: string; message: string }> = [];
    let duplicateCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
      if (cols.length < 4) continue;

      const rowNum = i + 1;
      const empNum = cols[0] || `PF-R7-2026-${String(100 + i).padStart(4, '0')}`;
      const fName = cols[1] || '';
      const lName = cols[2] || '';
      const email = cols[3] || `${fName.toLowerCase()}.${lName.toLowerCase()}@philfida.da.gov.ph`;

      // Validation Checks
      if (!fName) errors.push({ row: rowNum, field: 'firstName', message: 'First name is required' });
      if (!lName) errors.push({ row: rowNum, field: 'lastName', message: 'Last name is required' });
      if (!email) errors.push({ row: rowNum, field: 'email', message: 'Email is required' });

      if (existingNumbers.has(empNum.toLowerCase()) || existingEmails.has(email.toLowerCase())) {
        duplicateCount++;
        errors.push({ row: rowNum, field: 'employeeNumber/email', message: `Duplicate employee record (${empNum} / ${email})` });
      }

      parsedRows.push({
        employeeNumber: empNum,
        firstName: fName,
        middleName: cols[4] || '',
        lastName: lName,
        suffix: cols[5] || '',
        email,
        contactNumber: cols[6] || '+63 917 000 0000',
        office: cols[7] || 'PhilFIDA Regional Office VII - Cebu HQ',
        division: cols[8] || 'Administrative & Finance Unit',
        position: cols[9] || 'Fiber Officer',
        appointmentType: cols[10] || 'Permanent',
        appointmentDate: cols[11] || new Date().toISOString().split('T')[0],
        beginningVL: parseFloat(cols[12]) || 0,
        beginningSL: parseFloat(cols[13]) || 0,
        beginningCTO: parseFloat(cols[14]) || 0,
      });
    }

    const summary: ImportSummary = {
      totalRows: parsedRows.length,
      validRows: parsedRows.length - errors.length,
      duplicateCount,
      errorCount: errors.length,
      errors,
    };

    return { rows: parsedRows, summary };
  }

  static async executeImport(rows: ImportEmployeeRow[], processedBy: string = 'admin@philfida.da.gov.ph') {
    const leaveTypes = await dbStore.getLeaveTypes();
    const vlType = leaveTypes.find(lt => lt.code === 'VL') || leaveTypes[0];
    const slType = leaveTypes.find(lt => lt.code === 'SL') || leaveTypes[1];
    const ctoType = leaveTypes.find(lt => lt.code === 'COMP') || leaveTypes[2];

    let successCount = 0;
    const importedEmployees: Employee[] = [];

    for (const row of rows) {
      try {
        // 1. Create Employee
        const emp = await dbStore.createEmployee({
          employeeNumber: row.employeeNumber,
          firstName: row.firstName,
          middleName: row.middleName || '',
          lastName: row.lastName,
          suffix: row.suffix || '',
          email: row.email,
          contactNumber: row.contactNumber || '+63 917 000 0000',
          office: row.office || 'PhilFIDA Regional Office VII - Cebu HQ',
          division: row.division || 'Administrative & Finance Unit',
          position: row.position || 'Fiber Officer',
          appointmentType: row.appointmentType as any || 'Permanent',
          employmentStatus: 'Active',
          appointmentDate: row.appointmentDate || new Date().toISOString().split('T')[0],
          isActive: true,
        });

        // 2. Initialize Beginning Balances
        if ((row.beginningVL || 0) > 0) {
          await dbStore.executeLeaveTransaction({
            employeeId: emp.id,
            leaveTypeId: vlType.id,
            transactionType: 'Credit',
            source: 'Beginning Balance',
            amount: row.beginningVL || 0,
            referenceId: `REF-INIT-VL-${emp.employeeNumber}`,
            remarks: 'Initial beginning vacation leave balance encoding',
            createdBy: processedBy,
          });
        }

        if ((row.beginningSL || 0) > 0) {
          await dbStore.executeLeaveTransaction({
            employeeId: emp.id,
            leaveTypeId: slType.id,
            transactionType: 'Credit',
            source: 'Beginning Balance',
            amount: row.beginningSL || 0,
            referenceId: `REF-INIT-SL-${emp.employeeNumber}`,
            remarks: 'Initial beginning sick leave balance encoding',
            createdBy: processedBy,
          });
        }

        if ((row.beginningCTO || 0) > 0 && ctoType) {
          await dbStore.executeLeaveTransaction({
            employeeId: emp.id,
            leaveTypeId: ctoType.id,
            transactionType: 'Credit',
            source: 'Beginning Balance',
            amount: row.beginningCTO || 0,
            referenceId: `REF-INIT-CTO-${emp.employeeNumber}`,
            remarks: 'Initial beginning CTO leave credit encoding',
            createdBy: processedBy,
          });
        }

        importedEmployees.push(emp);
        successCount++;
      } catch (err) {
        console.warn(`Failed row import for ${row.employeeNumber}:`, err);
      }
    }

    await AuditService.log({
      userId: 'user_admin',
      action: 'BATCH_IMPORT_EMPLOYEES',
      module: 'Employee Migration Tool',
      recordId: `IMPORT-${Date.now()}`,
      newValue: { successCount, totalRows: rows.length, processedBy },
    });

    return { successCount, importedEmployees };
  }
}
