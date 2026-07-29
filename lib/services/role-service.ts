import { dbStore } from './store-db';
import { Role } from '@/types';

export class RoleService {
  static async getAll(): Promise<Role[]> {
    return dbStore.getRoles();
  }

  static async getById(id: string): Promise<Role | null> {
    return dbStore.getRoleById(id);
  }

  static async create(data: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Promise<Role> {
    return dbStore.createRole(data);
  }

  static async update(id: string, data: Partial<Role>): Promise<Role | null> {
    return dbStore.updateRole(id, data);
  }

  static async delete(id: string): Promise<boolean> {
    return dbStore.deleteRole(id);
  }
}
