import { dbStore } from './store-db';
import { Holiday } from '@/types';

export class HolidayService {
  static async getAll(): Promise<Holiday[]> {
    return dbStore.getHolidays();
  }

  static async getById(id: string): Promise<Holiday | null> {
    return dbStore.getHolidayById(id);
  }

  static async create(data: Omit<Holiday, 'id' | 'createdAt'>): Promise<Holiday> {
    return dbStore.createHoliday(data);
  }

  static async update(id: string, data: Partial<Holiday>): Promise<Holiday | null> {
    return dbStore.updateHoliday(id, data);
  }

  static async delete(id: string): Promise<boolean> {
    return dbStore.deleteHoliday(id);
  }

  /**
   * Calculates net working days between startDate and endDate excluding weekends and official public holidays
   */
  static async calculateWorkingDays(startDateStr: string, endDateStr: string): Promise<{
    totalCalendarDays: number;
    workingDays: number;
    holidaysCount: number;
    weekendDaysCount: number;
  }> {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
      return { totalCalendarDays: 0, workingDays: 0, holidaysCount: 0, weekendDaysCount: 0 };
    }

    const holidays = await dbStore.getHolidays();
    const holidayDatesSet = new Set(holidays.map(h => h.date));

    let workingDays = 0;
    let holidaysCount = 0;
    let weekendDaysCount = 0;
    let totalCalendarDays = 0;

    const current = new Date(start);

    while (current <= end) {
      totalCalendarDays++;
      const dayOfWeek = current.getDay(); // 0 = Sunday, 6 = Saturday
      const dateIso = current.toISOString().split('T')[0];

      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isHoliday = holidayDatesSet.has(dateIso);

      if (isWeekend) {
        weekendDaysCount++;
      } else if (isHoliday) {
        holidaysCount++;
      } else {
        workingDays++;
      }

      current.setDate(current.getDate() + 1);
    }

    return { totalCalendarDays, workingDays, holidaysCount, weekendDaysCount };
  }
}
