import { NextRequest, NextResponse } from 'next/server';
import { LeaveApplicationService } from '@/lib/services/leave-application-service';
import { approvalSchema } from '@/lib/validations/schemas';
import { AuditService } from '@/lib/services/audit-service';

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const application = await LeaveApplicationService.getById(id);
    if (!application) {
      return NextResponse.json({ error: 'Leave application not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: application });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch leave application', message: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const body = await req.json();

    if (body.status === 'Cancelled') {
      const application = await LeaveApplicationService.updateStatus(id, 'Cancelled');
      return NextResponse.json({ success: true, data: application });
    }

    const validation = approvalSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation Error', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { status, approvalRemarks } = validation.data;
    const approverId = body.approverId || 'emp_102'; // default HR officer

    const updated = await LeaveApplicationService.updateStatus(
      id,
      status,
      approverId,
      approvalRemarks
    );

    // Audit log
    await AuditService.log({
      userId: body.userId || 'user_hr',
      action: status === 'Approved' ? 'APPROVE_LEAVE_APPLICATION' : 'REJECT_LEAVE_APPLICATION',
      module: 'Leave Applications',
      recordId: id,
      oldValue: { status: 'Pending' },
      newValue: { status, approvalRemarks },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to process leave application', message: error.message },
      { status: 400 }
    );
  }
}
