import { NextRequest, NextResponse } from 'next/server';
import { uploadAttachment } from '@/lib/firebase/storage';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'leave_attachments';

    if (!file) {
      return NextResponse.json({ error: 'No file provided in form data' }, { status: 400 });
    }

    const url = await uploadAttachment(file, folder);
    return NextResponse.json({ success: true, url, fileName: file.name });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to upload attachment', message: error.message },
      { status: 500 }
    );
  }
}
