import { NextRequest, NextResponse } from 'next/server';
import { HolidayService } from '@/lib/services/holiday-service';
import { holidaySchema } from '@/lib/validations/schemas';
import { AuditService } from '@/lib/services/audit-service';

export async function GET() {
  try {
    const holidays = await HolidayService.getAll();
    return NextResponse.json({ success: true, data: holidays });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch holidays', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = holidaySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation Error', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const holiday = await HolidayService.create(validation.data);

    // Audit log
    await AuditService.log({
      userId: body.userId || 'user_admin',
      action: 'CREATE_HOLIDAY',
      module: 'Holiday Management',
      recordId: holiday.id,
      newValue: holiday,
    });

    return NextResponse.json({ success: true, data: holiday }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to create holiday', message: error.message },
      { status: 400 }
    );
  }
}
