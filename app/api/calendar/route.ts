import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/services/store-db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month'); // e.g. 1-12
    const year = searchParams.get('year'); // e.g. 2026

    const [applications, holidays, employees] = await Promise.all([
      dbStore.getLeaveApplications(),
      dbStore.getHolidays(),
      dbStore.getEmployees(),
    ]);

    const events = [];

    // 1. Add Holidays
    for (const h of holidays) {
      events.push({
        id: h.id,
        title: h.holidayName,
        date: h.date,
        type: 'Holiday',
        category: h.holidayType,
        color: h.holidayType === 'Regular' ? 'rose' : h.holidayType === 'Special' ? 'amber' : 'purple',
        details: { holidayType: h.holidayType, isRecurring: h.isRecurring },
      });
    }

    // 2. Add Leave Applications
    for (const app of applications) {
      const emp = employees.find(e => e.id === app.employeeId);
      const empName = emp ? `${emp.firstName} ${emp.lastName}` : 'Employee';
      const color = app.status === 'Approved' ? 'emerald' : app.status === 'Pending' ? 'amber' : 'slate';

      events.push({
        id: app.id,
        title: `${empName} - ${app.leaveType?.code || 'Leave'} (${app.status})`,
        startDate: app.startDate,
        endDate: app.endDate,
        type: 'Leave',
        status: app.status,
        color,
        details: {
          employeeName: empName,
          leaveType: app.leaveType?.leaveName,
          days: app.numberOfDays,
          reason: app.reason,
          status: app.status,
        },
      });
    }

    return NextResponse.json({ success: true, data: events });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch calendar events', message: error.message },
      { status: 500 }
    );
  }
}
