import { NextRequest, NextResponse } from 'next/server';
import { AccrualService } from '@/lib/services/accrual-service';
import { monthlyAccrualSchema } from '@/lib/validations/schemas';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
    const mode = searchParams.get('mode'); // 'preview' or 'logs'

    if (mode === 'logs') {
      const logs = await AccrualService.getLogs({ month, year });
      return NextResponse.json({ success: true, data: logs });
    }

    const preview = await AccrualService.previewMonthlyAccrual(month, year);
    return NextResponse.json({ success: true, data: preview });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to process monthly accrual preview', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = monthlyAccrualSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation Error', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { month, year } = validation.data;
    const processedBy = body.processedBy || 'admin@philfida.da.gov.ph';

    const result = await AccrualService.executeMonthlyAccrual(month, year, processedBy);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to execute monthly accrual process', message: error.message },
      { status: 400 }
    );
  }
}
