/**
 * POST /api/auth/verify-email
 * 
 * Synchronizes email verification status after user confirms their link via Firebase Auth.
 */
import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/services/user-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body as { email: string };

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await UserService.getByEmail(email.trim().toLowerCase());
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updated = await UserService.update(user.id, {
      emailVerified: true,
    });

    return NextResponse.json({
      success: true,
      emailVerified: true,
      message: 'Email verification successfully confirmed.',
      user: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Email verification update failed', message: error.message },
      { status: 500 }
    );
  }
}
