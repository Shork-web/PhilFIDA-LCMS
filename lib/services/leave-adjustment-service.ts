import { dbStore } from './store-db';
import { LeaveAdjustment } from '@/types';

export class LeaveAdjustmentService {
  static async getAll(filter?: { employeeId?: string }): Promise<LeaveAdjustment[]> {
    return dbStore.getLeaveAdjustments(filter);
  }

  static async create(data: Omit<LeaveAdjustment, 'id' | 'createdAt'>): Promise<LeaveAdjustment> {
    return dbStore.createLeaveAdjustment(data);
  }
}
