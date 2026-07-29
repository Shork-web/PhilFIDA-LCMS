import { dbStore } from './store-db';
import { Notification } from '@/types';

export class NotificationService {
  static async getByUser(userId: string): Promise<Notification[]> {
    return dbStore.getNotifications(userId);
  }

  static async create(data: Omit<Notification, 'id' | 'createdAt' | 'isRead'>): Promise<Notification> {
    return dbStore.createNotification(data);
  }

  static async markAsRead(id: string): Promise<boolean> {
    return dbStore.markNotificationAsRead(id);
  }

  static async markAllAsRead(userId: string): Promise<boolean> {
    return dbStore.markAllNotificationsAsRead(userId);
  }
}
