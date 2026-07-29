import { dbStore } from './store-db';
import { DocumentRecord } from '@/types';

export class DocumentService {
  static async getDocuments(filter?: { employeeId?: string; category?: string }): Promise<DocumentRecord[]> {
    return dbStore.getDocuments(filter);
  }

  static async create(data: Omit<DocumentRecord, 'id' | 'createdAt' | 'isDeleted'>): Promise<DocumentRecord> {
    return dbStore.createDocument(data);
  }

  static async softDelete(id: string): Promise<boolean> {
    return dbStore.softDeleteDocument(id);
  }
}
