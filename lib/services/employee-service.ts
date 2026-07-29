import { dbStore } from './store-db';
import { Employee } from '@/types';

export class EmployeeService {
  static async getAll(): Promise<Employee[]> {
    return dbStore.getEmployees();
  }

  static async getById(id: string): Promise<Employee | null> {
    return dbStore.getEmployeeById(id);
  }

  static async create(data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<Employee> {
    return dbStore.createEmployee(data);
  }

  static async update(id: string, data: Partial<Employee>): Promise<Employee | null> {
    return dbStore.updateEmployee(id, data);
  }

  static async toggleActive(id: string, isActive: boolean): Promise<Employee | null> {
    return dbStore.toggleEmployeeStatus(id, isActive);
  }
}
