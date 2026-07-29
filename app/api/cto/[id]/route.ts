import { NextRequest, NextResponse } from 'next/server';
import { CTOService } from '@/lib/services/cto-service';
import { approvalSchema } from '@/lib/validations/schemas';
import { AuditService } from '@/lib/services/audit-service';

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const cto = await CTOService.getById(id);
    if (!cto) {
      return NextResponse.json({ error: 'CTO request not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: cto });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch CTO request', message: error.message },
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

    const validation = approvalSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation Error', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { status, approvalRemarks } = validation.data;
    const approverId = body.approverId || 'emp_102'; // default HR officer

    const updated = await CTOService.updateStatus(
      id,
      status,
      approverId,
      approvalRemarks
    );

    // Audit log
    await AuditService.log({
      userId: body.userId || 'user_hr',
      action: status === 'Approved' ? 'APPROVE_CTO_REQUEST' : 'REJECT_CTO_REQUEST',
      module: 'CTO',
      recordId: id,
      oldValue: { status: 'Pending' },
      newValue: { status, approvalRemarks, equivalentLeave: updated.equivalentLeave },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to process CTO request', message: error.message },
      { status: 400 }
    );
  }
}
