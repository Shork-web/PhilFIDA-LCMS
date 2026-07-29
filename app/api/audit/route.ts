import { NextRequest, NextResponse } from 'next/server';
import { AuditService } from '@/lib/services/audit-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || undefined;
    const moduleName = searchParams.get('module') || undefined;

    const logs = await AuditService.getAll({ userId, module: moduleName });
    return NextResponse.json({ success: true, data: logs });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch audit logs', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, action, module: moduleName, recordId, oldValue, newValue, ipAddress } = body;

    if (!userId || !action || !moduleName || !recordId) {
      return NextResponse.json(
        { error: 'userId, action, module, and recordId are required fields' },
        { status: 400 }
      );
    }

    const log = await AuditService.log({
      userId,
      action,
      module: moduleName,
      recordId,
      oldValue,
      newValue,
      ipAddress,
    });

    return NextResponse.json({ success: true, data: log }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to log audit event', message: error.message },
      { status: 500 }
    );
  }
}
