import { dbStore } from './store-db';
import { LeaveBalance } from '@/types';

export class LeaveBalanceService {
  static async getByEmployee(employeeId: string): Promise<LeaveBalance[]> {
    return dbStore.getLeaveBalancesByEmployee(employeeId);
  }

  static async getAll(): Promise<LeaveBalance[]> {
    return dbStore.getAllLeaveBalances();
  }

  static async updateBalance(employeeId: string, leaveTypeId: string, newBalance: number): Promise<LeaveBalance | null> {
    return dbStore.updateLeaveBalance(employeeId, leaveTypeId, newBalance);
  }

  static async initializeForNewEmployee(employeeId: string): Promise<void> {
    const leaveTypes = await dbStore.getLeaveTypes();
    const activeTypes = leaveTypes.filter(lt => lt.isActive);
    for (const lt of activeTypes) {
      await dbStore.createLeaveBalance({
        employeeId,
        leaveTypeId: lt.id,
        balance: 0,
      });
    }
  }
}
