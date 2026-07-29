import { NextRequest, NextResponse } from 'next/server';
import { LeaveTypeService } from '@/lib/services/leave-type-service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const leaveType = await LeaveTypeService.getById(id);
    if (!leaveType) return NextResponse.json({ error: 'Leave type not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: leaveType });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch leave type', message: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updated = await LeaveTypeService.update(id, body);
    if (!updated) return NextResponse.json({ error: 'Leave type not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update leave type', message: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { isActive } = await req.json();
    const updated = await LeaveTypeService.toggleActive(id, isActive);
    if (!updated) return NextResponse.json({ error: 'Leave type not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update leave type status', message: error.message }, { status: 500 });
  }
}
