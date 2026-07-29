import { dbStore } from './store-db';
import { LeaveTransaction } from '@/types';

export class LeaveTransactionService {
  static async getAll(filter?: {
    employeeId?: string;
    leaveTypeId?: string;
    transactionType?: string;
    source?: string;
  }): Promise<LeaveTransaction[]> {
    return dbStore.getLeaveTransactions(filter);
  }

  static async getByEmployee(employeeId: string): Promise<LeaveTransaction[]> {
    return dbStore.getLeaveTransactions({ employeeId });
  }

  static async executeTransaction(params: Parameters<typeof dbStore.executeLeaveTransaction>[0]): Promise<LeaveTransaction> {
    return dbStore.executeLeaveTransaction(params);
  }
}
