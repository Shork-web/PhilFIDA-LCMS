import { NextRequest, NextResponse } from 'next/server';
import { DocumentService } from '@/lib/services/document-service';
import { AuditService } from '@/lib/services/audit-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId') || undefined;
    const category = searchParams.get('category') || undefined;

    const docs = await DocumentService.getDocuments({ employeeId, category });
    return NextResponse.json({ success: true, data: docs });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch document repository', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, fileName, fileUrl, fileType, fileSize, category, employeeId, uploadedBy } = body;

    if (!title || !fileName || !fileUrl) {
      return NextResponse.json({ error: 'Title, fileName, and fileUrl are required' }, { status: 400 });
    }

    const doc = await DocumentService.create({
      title,
      fileName,
      fileUrl,
      fileType: fileType || 'application/pdf',
      fileSize: fileSize || 1024,
      category: category || 'Other',
      employeeId,
      uploadedBy: uploadedBy || 'admin@philfida.da.gov.ph',
    });

    await AuditService.log({
      userId: uploadedBy || 'user_admin',
      action: 'UPLOAD_DOCUMENT',
      module: 'Document Repository',
      recordId: doc.id,
      newValue: { title, fileName, category },
    });

    return NextResponse.json({ success: true, data: doc }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to upload document record', message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Document id is required' }, { status: 400 });
    }

    const deleted = await DocumentService.softDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    await AuditService.log({
      userId: 'user_admin',
      action: 'SOFT_DELETE_DOCUMENT',
      module: 'Document Repository',
      recordId: id,
    });

    return NextResponse.json({ success: true, message: 'Document deleted successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to delete document', message: error.message },
      { status: 500 }
    );
  }
}
