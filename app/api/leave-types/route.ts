import { NextRequest, NextResponse } from 'next/server';
import { leaveTypeSchema } from '@/lib/validations/schemas';
import { LeaveTypeService } from '@/lib/services/leave-type-service';

export async function GET() {
  try {
    const leaveTypes = await LeaveTypeService.getAll();
    return NextResponse.json({ success: true, data: leaveTypes });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch leave types', message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = leaveTypeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const newLt = await LeaveTypeService.create(result.data);
    return NextResponse.json({ success: true, data: newLt }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to create leave type', message: error.message }, { status: 500 });
  }
}
