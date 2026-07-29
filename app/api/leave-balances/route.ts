import { NextRequest, NextResponse } from 'next/server';
import { LeaveBalanceService } from '@/lib/services/leave-balance-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId');

    if (employeeId) {
      const balances = await LeaveBalanceService.getByEmployee(employeeId);
      return NextResponse.json({ success: true, data: balances });
    }

    const allBalances = await LeaveBalanceService.getAll();
    return NextResponse.json({ success: true, data: allBalances });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch leave balances', message: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { employeeId, leaveTypeId, balance } = body;

    if (!employeeId || !leaveTypeId || typeof balance !== 'number') {
      return NextResponse.json({ error: 'employeeId, leaveTypeId, and balance are required' }, { status: 400 });
    }

    const updated = await LeaveBalanceService.updateBalance(employeeId, leaveTypeId, balance);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update leave balance', message: error.message }, { status: 500 });
  }
}
