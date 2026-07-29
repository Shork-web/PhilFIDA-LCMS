import { NextRequest, NextResponse } from 'next/server';
import { ExportService } from '@/lib/services/export-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const target = searchParams.get('target'); // 'employees', 'ledger', 'applications', or 'audit'

    let csvContent = '';
    let fileName = 'export.csv';

    if (target === 'employees') {
      csvContent = await ExportService.exportEmployeesCSV();
      fileName = `PhilFIDA_R7_Employees_${new Date().toISOString().split('T')[0]}.csv`;
    } else if (target === 'ledger') {
      csvContent = await ExportService.exportLedgerCSV();
      fileName = `PhilFIDA_R7_Leave_Ledger_${new Date().toISOString().split('T')[0]}.csv`;
    } else if (target === 'applications') {
      csvContent = await ExportService.exportApplicationsCSV();
      fileName = `PhilFIDA_R7_Leave_Applications_${new Date().toISOString().split('T')[0]}.csv`;
    } else if (target === 'audit') {
      csvContent = await ExportService.exportAuditLogsCSV();
      fileName = `PhilFIDA_R7_Audit_Logs_${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      return NextResponse.json({ error: 'Target export type invalid or not specified' }, { status: 400 });
    }

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to generate export file', message: error.message },
      { status: 500 }
    );
  }
}
