import { NextRequest, NextResponse } from 'next/server';
import { LeaveTransactionService } from '@/lib/services/leave-transaction-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId') || undefined;
    const leaveTypeId = searchParams.get('leaveTypeId') || undefined;
    const transactionType = searchParams.get('transactionType') || undefined;
    const source = searchParams.get('source') || undefined;

    const transactions = await LeaveTransactionService.getAll({
      employeeId,
      leaveTypeId,
      transactionType,
      source,
    });

    return NextResponse.json({ success: true, data: transactions });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch leave transactions', message: error.message },
      { status: 500 }
    );
  }
}
