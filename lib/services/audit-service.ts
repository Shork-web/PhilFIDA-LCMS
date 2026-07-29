import { dbStore } from './store-db';
import { AuditLog } from '@/types';

export class AuditService {
  static async getAll(filter?: { userId?: string; module?: string }): Promise<AuditLog[]> {
    return dbStore.getAuditLogs(filter);
  }

  static async log(data: Omit<AuditLog, 'id' | 'createdAt'>): Promise<AuditLog> {
    return dbStore.createAuditLog(data);
  }
}
