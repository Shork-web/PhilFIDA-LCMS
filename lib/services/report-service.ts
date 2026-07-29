import { dbStore } from './store-db';
import { Employee, LeaveBalance, LeaveTransaction, GeneratedReport } from '@/types';

export class ReportService {
  static async getGeneratedReports(): Promise<GeneratedReport[]> {
    return dbStore.getGeneratedReports();
  }

  static async createReportRecord(data: Omit<GeneratedReport, 'id' | 'dateGenerated'>): Promise<GeneratedReport> {
    return dbStore.createGeneratedReport(data);
  }

  static async generateEmployeeLeaveCard(employeeId: string) {
    const employee = await dbStore.getEmployeeById(employeeId);
    if (!employee) throw new Error('Employee not found');

    const balances = await dbStore.getLeaveBalancesByEmployee(employeeId);
    const transactions = await dbStore.getLeaveTransactions({ employeeId });
    const applications = await dbStore.getLeaveApplications({ employeeId });

    // Group transactions by month & leave type
    const vlTransactions = transactions.filter(t => t.leaveType?.code === 'VL');
    const slTransactions = transactions.filter(t => t.leaveType?.code === 'SL');
    const ctoTransactions = transactions.filter(t => t.leaveType?.code === 'COMP');

    return {
      employee,
      balances,
      transactions,
      applications,
      vlTransactions,
      slTransactions,
      ctoTransactions,
      generatedAt: new Date().toISOString(),
    };
  }

  static async getLowBalanceEmployees(threshold: number = 3.0) {
    const employees = await dbStore.getEmployees();
    const allBalances = await dbStore.getAllLeaveBalances();

    const lowBalanceList: { employee: Employee; balance: LeaveBalance }[] = [];

    allBalances.forEach(b => {
      if (b.balance < threshold && b.leaveType?.code === 'VL') {
        const emp = employees.find(e => e.id === b.employeeId);
        if (emp && emp.isActive) {
          lowBalanceList.push({ employee: emp, balance: b });
        }
      }
    });

    return lowBalanceList;
  }
}
