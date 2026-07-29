import { NextRequest, NextResponse } from 'next/server';
import { userSchema } from '@/lib/validations/schemas';
import { UserService } from '@/lib/services/user-service';

export async function GET() {
  try {
    const users = await UserService.getAll();
    return NextResponse.json({ success: true, data: users });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch users', message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = userSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const newUser = await UserService.create({
      ...result.data,
      accountStatus: result.data.accountStatus || 'Active',
      username: result.data.username,
    });
    return NextResponse.json({ success: true, data: newUser }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to create user', message: error.message }, { status: 500 });
  }
}
