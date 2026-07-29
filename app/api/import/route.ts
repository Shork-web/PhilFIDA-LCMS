import { NextRequest, NextResponse } from 'next/server';
import { ImportService } from '@/lib/services/import-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, csvText, rows, processedBy } = body;

    if (action === 'preview' && csvText) {
      const previewResult = await ImportService.parseAndValidateCSV(csvText);
      return NextResponse.json({ success: true, data: previewResult });
    }

    if (action === 'execute' && rows && Array.isArray(rows)) {
      const importResult = await ImportService.executeImport(rows, processedBy || 'admin@philfida.da.gov.ph');
      return NextResponse.json({ success: true, data: importResult });
    }

    return NextResponse.json({ error: 'Invalid import action or missing data' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to process import request', message: error.message },
      { status: 500 }
    );
  }
}
