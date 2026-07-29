import { NextRequest, NextResponse } from 'next/server';
import { CTOService } from '@/lib/services/cto-service';
import { ctoRequestSchema } from '@/lib/validations/schemas';
import { AuditService } from '@/lib/services/audit-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId') || undefined;
    const status = searchParams.get('status') || undefined;

    const ctoRequests = await CTOService.getAll({ employeeId, status });
    return NextResponse.json({ success: true, data: ctoRequests });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch CTO requests', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = ctoRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation Error', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const ctoRequest = await CTOService.create(validation.data);

    // Audit log
    await AuditService.log({
      userId: body.userId || 'user_emp',
      action: 'SUBMIT_CTO_REQUEST',
      module: 'CTO',
      recordId: ctoRequest.id,
      newValue: {
        employeeId: ctoRequest.employeeId,
        dateWorked: ctoRequest.dateWorked,
        hoursWorked: ctoRequest.hoursWorked,
        equivalentLeave: ctoRequest.equivalentLeave,
      },
    });

    return NextResponse.json({ success: true, data: ctoRequest }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to submit CTO request', message: error.message },
      { status: 400 }
    );
  }
}
