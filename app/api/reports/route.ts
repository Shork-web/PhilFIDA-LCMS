import { NextRequest, NextResponse } from 'next/server';
import { ReportService } from '@/lib/services/report-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'leaveCard', 'lowBalance', or 'reportsList'
    const employeeId = searchParams.get('employeeId');

    if (type === 'leaveCard' && employeeId) {
      const leaveCardData = await ReportService.generateEmployeeLeaveCard(employeeId);
      return NextResponse.json({ success: true, data: leaveCardData });
    }

    if (type === 'lowBalance') {
      const threshold = parseFloat(searchParams.get('threshold') || '3.0');
      const lowBalanceList = await ReportService.getLowBalanceEmployees(threshold);
      return NextResponse.json({ success: true, data: lowBalanceList });
    }

    const reports = await ReportService.getGeneratedReports();
    return NextResponse.json({ success: true, data: reports });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to generate report data', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { reportName, generatedBy, fileUrl } = body;

    if (!reportName || !generatedBy) {
      return NextResponse.json({ error: 'reportName and generatedBy are required' }, { status: 400 });
    }

    const report = await ReportService.createReportRecord({ reportName, generatedBy, fileUrl });
    return NextResponse.json({ success: true, data: report }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to record generated report', message: error.message },
      { status: 500 }
    );
  }
}
