import { NextRequest, NextResponse } from 'next/server';
import { LeaveAdjustmentService } from '@/lib/services/leave-adjustment-service';
import { leaveAdjustmentSchema } from '@/lib/validations/schemas';
import { AuditService } from '@/lib/services/audit-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId') || undefined;

    const adjustments = await LeaveAdjustmentService.getAll({ employeeId });
    return NextResponse.json({ success: true, data: adjustments });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch leave adjustments', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = leaveAdjustmentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation Error', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const createdBy = body.createdBy || 'admin@philfida.da.gov.ph';
    const adjustment = await LeaveAdjustmentService.create({
      ...validation.data,
      createdBy,
    });

    // Audit log
    await AuditService.log({
      userId: body.userId || 'user_admin',
      action: 'MANUAL_LEAVE_ADJUSTMENT',
      module: 'Leave Adjustments',
      recordId: adjustment.id,
      newValue: {
        employeeId: adjustment.employeeId,
        leaveTypeId: adjustment.leaveTypeId,
        type: adjustment.adjustmentType,
        amount: adjustment.amount,
        reason: adjustment.reason,
      },
    });

    return NextResponse.json({ success: true, data: adjustment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to create manual leave adjustment', message: error.message },
      { status: 400 }
    );
  }
}
