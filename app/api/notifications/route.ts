import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/lib/services/notification-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || undefined;

    const notifications = await NotificationService.getByUser(userId || 'user_emp');
    return NextResponse.json({ success: true, data: notifications });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch notifications', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, title, message, type, link } = body;

    if (!userId || !title || !message || !type) {
      return NextResponse.json({ error: 'userId, title, message, and type are required' }, { status: 400 });
    }

    const created = await NotificationService.create({ userId, title, message, type, link });
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to create notification', message: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, userId, action } = body;

    if (action === 'markAllRead' && userId) {
      await NotificationService.markAllAsRead(userId);
      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    }

    if (id) {
      await NotificationService.markAsRead(id);
      return NextResponse.json({ success: true, message: 'Notification marked as read' });
    }

    return NextResponse.json({ error: 'id or action=markAllRead required' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to update notification', message: error.message },
      { status: 500 }
    );
  }
}
