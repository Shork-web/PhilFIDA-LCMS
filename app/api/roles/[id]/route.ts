import { NextRequest, NextResponse } from 'next/server';
import { RoleService } from '@/lib/services/role-service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const role = await RoleService.getById(id);
    if (!role) return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: role });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch role', message: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updated = await RoleService.update(id, body);
    if (!updated) return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update role', message: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await RoleService.delete(id);
    if (!deleted) {
      return NextResponse.json(
        { error: 'Cannot delete system-protected role or role not found' },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: true, message: 'Role deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete role', message: error.message }, { status: 500 });
  }
}
