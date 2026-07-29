import { NextRequest, NextResponse } from 'next/server';
import { LeaveApplicationService } from '@/lib/services/leave-application-service';
import { leaveApplicationSchema } from '@/lib/validations/schemas';
import { AuditService } from '@/lib/services/audit-service';
import { Logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId') || undefined;
    const status = searchParams.get('status') || undefined;

    const applications = await LeaveApplicationService.getAll({ employeeId, status });
    return NextResponse.json({ success: true, data: applications });
  } catch (error: any) {
    Logger.error('LeaveApplicationsAPI', 'Failed to fetch leave applications', error);
    return NextResponse.json(
      { error: 'Failed to fetch leave applications', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = leaveApplicationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation Error', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const application = await LeaveApplicationService.create(validation.data);

    // Audit log
    await AuditService.log({
      userId: body.userId || 'user_emp',
      action: 'SUBMIT_LEAVE_APPLICATION',
      module: 'Leave Applications',
      recordId: application.id,
      newValue: {
        employeeId: application.employeeId,
        leaveTypeId: application.leaveTypeId,
        days: application.numberOfDays,
        startDate: application.startDate,
        endDate: application.endDate,
      },
    });

    return NextResponse.json({ success: true, data: application }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to submit leave application', message: error.message },
      { status: 400 }
    );
  }
}
