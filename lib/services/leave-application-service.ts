import { dbStore } from './store-db';
import { LeaveApplication, LeaveApplicationStatus } from '@/types';

export class LeaveApplicationService {
  static async getAll(filter?: { employeeId?: string; status?: string }): Promise<LeaveApplication[]> {
    return dbStore.getLeaveApplications(filter);
  }

  static async getById(id: string): Promise<LeaveApplication | null> {
    return dbStore.getLeaveApplicationById(id);
  }

  static async create(data: Omit<LeaveApplication, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<LeaveApplication> {
    return dbStore.createLeaveApplication(data);
  }

  static async updateStatus(
    id: string,
    status: LeaveApplicationStatus,
    approverId?: string,
    approvalRemarks?: string
  ): Promise<LeaveApplication> {
    return dbStore.updateLeaveApplicationStatus(id, status, approverId, approvalRemarks);
  }
}
