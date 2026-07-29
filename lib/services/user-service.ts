import { dbStore } from './store-db';
import { User } from '@/types';

export class UserService {
  static async getAll(): Promise<User[]> {
    return dbStore.getUsers();
  }

  static async getById(id: string): Promise<User | null> {
    return dbStore.getUserById(id);
  }

  static async getByEmail(email: string): Promise<User | null> {
    return dbStore.getUserByEmail(email);
  }

  static async create(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    return dbStore.createUser(data);
  }

  static async update(id: string, data: Partial<User>): Promise<User | null> {
    return dbStore.updateUser(id, data);
  }

  static async toggleActive(id: string, isActive: boolean): Promise<User | null> {
    return dbStore.updateUser(id, { isActive });
  }
}
