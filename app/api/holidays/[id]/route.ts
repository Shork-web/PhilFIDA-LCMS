import { NextRequest, NextResponse } from 'next/server';
import { HolidayService } from '@/lib/services/holiday-service';
import { holidaySchema } from '@/lib/validations/schemas';
import { AuditService } from '@/lib/services/audit-service';

export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const body = await req.json();
    const validation = holidaySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation Error', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const oldHoliday = await HolidayService.getById(id);
    const updated = await HolidayService.update(id, validation.data);

    if (!updated) {
      return NextResponse.json({ error: 'Holiday not found' }, { status: 404 });
    }

    await AuditService.log({
      userId: body.userId || 'user_admin',
      action: 'UPDATE_HOLIDAY',
      module: 'Holiday Management',
      recordId: id,
      oldValue: oldHoliday,
      newValue: updated,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to update holiday', message: error.message },
      { status: 400 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const oldHoliday = await HolidayService.getById(id);
    const deleted = await HolidayService.delete(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Holiday not found' }, { status: 404 });
    }

    await AuditService.log({
      userId: 'user_admin',
      action: 'DELETE_HOLIDAY',
      module: 'Holiday Management',
      recordId: id,
      oldValue: oldHoliday,
    });

    return NextResponse.json({ success: true, message: 'Holiday deleted successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to delete holiday', message: error.message },
      { status: 500 }
    );
  }
}
