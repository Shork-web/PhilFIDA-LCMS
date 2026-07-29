import { NextRequest, NextResponse } from 'next/server';
import { roleSchema } from '@/lib/validations/schemas';
import { RoleService } from '@/lib/services/role-service';

export async function GET() {
  try {
    const roles = await RoleService.getAll();
    return NextResponse.json({ success: true, data: roles });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch roles', message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = roleSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const newRole = await RoleService.create({
      ...result.data,
      permissions: result.data.permissions as any,
    });
    return NextResponse.json({ success: true, data: newRole }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to create role', message: error.message }, { status: 500 });
  }
}
