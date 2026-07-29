import { dbStore } from './store-db';
import { CTORequest, CTOStatus } from '@/types';

export class CTOService {
  static async getAll(filter?: { employeeId?: string; status?: string }): Promise<CTORequest[]> {
    return dbStore.getCTORequests(filter);
  }

  static async getById(id: string): Promise<CTORequest | null> {
    return dbStore.getCTORequestById(id);
  }

  static async create(data: Omit<CTORequest, 'id' | 'equivalentLeave' | 'status' | 'createdAt'>): Promise<CTORequest> {
    return dbStore.createCTORequest(data);
  }

  static async updateStatus(
    id: string,
    status: CTOStatus,
    approverId?: string,
    approvalRemarks?: string
  ): Promise<CTORequest> {
    return dbStore.updateCTORequestStatus(id, status, approverId, approvalRemarks);
  }
}
