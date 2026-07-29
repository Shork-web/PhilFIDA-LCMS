import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/services/store-db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';

    if (!query.trim()) {
      return NextResponse.json({ success: true, data: [] });
    }

    const q = query.toLowerCase();

    const [employees, applications, transactions] = await Promise.all([
      dbStore.getEmployees(),
      dbStore.getLeaveApplications(),
      dbStore.getLeaveTransactions(),
    ]);

    const results: any[] = [];

    // Search Employees
    employees.forEach(e => {
      if (
        `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) ||
        e.employeeNumber.toLowerCase().includes(q) ||
        e.position.toLowerCase().includes(q) ||
        e.division.toLowerCase().includes(q)
      ) {
        results.push({
          id: e.id,
          category: 'Employee',
          title: `${e.firstName} ${e.lastName}`,
          subtitle: `${e.position} (${e.employeeNumber}) — ${e.division}`,
          link: `/dashboard/employees/${e.id}`,
        });
      }
    });

    // Search Applications
    applications.forEach(a => {
      const empName = a.employee ? `${a.employee.firstName} ${a.employee.lastName}` : '';
      if (
        empName.toLowerCase().includes(q) ||
        a.reason.toLowerCase().includes(q) ||
        (a.leaveType?.leaveName || '').toLowerCase().includes(q)
      ) {
        results.push({
          id: a.id,
          category: 'Leave Application',
          title: `${a.leaveType?.code || 'Leave'} Application (${a.status})`,
          subtitle: `${empName} — ${a.startDate} to ${a.endDate}`,
          link: `/dashboard/leave-applications`,
        });
      }
    });

    // Search Transactions
    transactions.forEach(t => {
      if (
        t.referenceId.toLowerCase().includes(q) ||
        t.remarks.toLowerCase().includes(q)
      ) {
        results.push({
          id: t.id,
          category: 'Transaction Ledger',
          title: `Ref: ${t.referenceId}`,
          subtitle: `${t.source} — ${t.transactionType} ${t.amount} days`,
          link: `/dashboard/leave-ledger`,
        });
      }
    });

    return NextResponse.json({ success: true, data: results.slice(0, 10) });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to execute global search', message: error.message },
      { status: 500 }
    );
  }
}
