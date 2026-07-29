import { dbStore } from './store-db';
import { LeaveType } from '@/types';

export class LeaveTypeService {
  static async getAll(): Promise<LeaveType[]> {
    return dbStore.getLeaveTypes();
  }

  static async getById(id: string): Promise<LeaveType | null> {
    return dbStore.getLeaveTypeById(id);
  }

  static async create(data: Omit<LeaveType, 'id' | 'createdAt' | 'updatedAt'>): Promise<LeaveType> {
    return dbStore.createLeaveType(data);
  }

  static async update(id: string, data: Partial<LeaveType>): Promise<LeaveType | null> {
    return dbStore.updateLeaveType(id, data);
  }

  static async toggleActive(id: string, isActive: boolean): Promise<LeaveType | null> {
    return dbStore.updateLeaveType(id, { isActive });
  }
}
