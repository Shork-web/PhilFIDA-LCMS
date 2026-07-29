import { dbStore } from './store-db';
import { SystemSettings } from '@/types';

export class SettingsService {
  static async getSettings(): Promise<SystemSettings> {
    return dbStore.getSystemSettings();
  }

  static async updateSettings(data: Partial<SystemSettings>): Promise<SystemSettings> {
    return dbStore.updateSystemSettings(data);
  }
}
