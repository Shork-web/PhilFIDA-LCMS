import { dbStore } from './store-db';

export class ExportService {
  static async exportEmployeesCSV(): Promise<string> {
    const employees = await dbStore.getEmployees();
    let csv = 'Employee Number,First Name,Middle Name,Last Name,Suffix,Email,Office,Division,Position,Appointment Type,Status\n';

    employees.forEach(e => {
      csv += `"${e.employeeNumber}","${e.firstName}","${e.middleName || ''}","${e.lastName}","${e.suffix || ''}","${e.email}","${e.office}","${e.division}","${e.position}","${e.appointmentType}","${e.employmentStatus}"\n`;
    });

    return csv;
  }

  static async exportLedgerCSV(): Promise<string> {
    const transactions = await dbStore.getLeaveTransactions();
    let csv = 'Transaction ID,Date,Employee Number,Employee Name,Source,Type,Leave Code,Amount,Balance Before,Balance After,Remarks\n';

    transactions.forEach(t => {
      const empName = t.employee ? `${t.employee.firstName} ${t.employee.lastName}` : 'N/A';
      csv += `"${t.id}","${new Date(t.createdAt).toLocaleDateString()}","${t.employee?.employeeNumber || ''}","${empName}","${t.source}","${t.transactionType}","${t.leaveType?.code || ''}",${t.amount},${t.balanceBefore},${t.balanceAfter},"${t.remarks.replace(/"/g, '""')}"\n`;
    });

    return csv;
  }

  static async exportApplicationsCSV(): Promise<string> {
    const applications = await dbStore.getLeaveApplications();
    let csv = 'Application ID,Employee Name,Leave Type,Start Date,End Date,Days,Reason,Status,Approved At\n';

    applications.forEach(a => {
      const empName = a.employee ? `${a.employee.firstName} ${a.employee.lastName}` : 'N/A';
      csv += `"${a.id}","${empName}","${a.leaveType?.code || ''}","${a.startDate}","${a.endDate}",${a.numberOfDays},"${a.reason.replace(/"/g, '""')}","${a.status}","${a.approvedAt || ''}"\n`;
    });

    return csv;
  }

  static async exportAuditLogsCSV(): Promise<string> {
    const logs = await dbStore.getAuditLogs();
    let csv = 'Log ID,Timestamp,User,Action,Module,Record ID,IP Address\n';

    logs.forEach(l => {
      const username = l.user?.username || l.userId;
      csv += `"${l.id}","${new Date(l.createdAt).toLocaleString()}","${username}","${l.action}","${l.module}","${l.recordId}","${l.ipAddress || ''}"\n`;
    });

    return csv;
  }
}
