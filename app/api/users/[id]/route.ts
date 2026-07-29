import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/services/user-service';
import { AuditService } from '@/lib/services/audit-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await UserService.getById(id);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: user });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch user', message: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updated = await UserService.update(id, body);
    if (!updated) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update user', message: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { action, actorId, ...updateData } = body;

    // Fetch current user for audit delta
    const existingUser = await UserService.getById(id);
    if (!existingUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // ─── Account Management Actions ──────────────────────────────────────────
    if (action === 'approve') {
      const targetRoleId = updateData.roleId || existingUser.roleId;
      const isSuperAdmin = targetRoleId === 'role_superadmin' || existingUser.email.toLowerCase() === 'iversonwork039@gmail.com' || existingUser.email.toLowerCase() === 'admin@philfida.da.gov.ph';
      let linkedEmployeeId = isSuperAdmin ? undefined : (updateData.employeeId || existingUser.employeeId);

      if (!isSuperAdmin && !linkedEmployeeId) {
        const { EmployeeService } = await import('@/lib/services/employee-service');
        const allEmps = await EmployeeService.getAll();
        let matchingEmp = allEmps.find(e => e.email.toLowerCase() === existingUser.email.toLowerCase());

        if (!matchingEmp) {
          const nameParts = (existingUser.displayName || existingUser.username || 'Employee User').trim().split(' ');
          const firstName = nameParts[0] || 'Employee';
          const lastName = nameParts.slice(1).join(' ') || 'Staff';
          matchingEmp = await EmployeeService.create({
            employeeNumber: `EMP-${Math.floor(100000 + Math.random() * 900000)}`,
            firstName,
            lastName,
            email: existingUser.email,
            contactNumber: 'N/A',
            position: 'Employee - Staff',
            office: 'PhilFIDA Regional Office VII - Cebu HQ',
            division: 'Administrative & Finance Division (AFD)',
            appointmentType: 'Permanent',
            employmentStatus: 'Active',
            appointmentDate: new Date().toISOString().split('T')[0],
            isActive: true,
          });
        }
        linkedEmployeeId = matchingEmp.id;
      }

      const updated = await UserService.update(id, {
        accountStatus: 'Active',
        isActive: true,
        ...(linkedEmployeeId ? { employeeId: linkedEmployeeId } : {}),
        ...(updateData.roleId ? { roleId: updateData.roleId } : {}),
      });

      await AuditService.log({
        userId: actorId || 'system',
        action: 'ACCOUNT_APPROVED',
        module: 'Account Management',
        recordId: id,
        oldValue: { accountStatus: existingUser.accountStatus },
        newValue: { accountStatus: 'Active', employeeId: linkedEmployeeId, roleId: updateData.roleId || existingUser.roleId },
      });
      return NextResponse.json({ success: true, data: updated, message: 'Account approved and linked to Employee record!' });
    }

    if (action === 'reject') {
      const updated = await UserService.update(id, { accountStatus: 'Rejected', isActive: false });
      await AuditService.log({
        userId: actorId || 'system',
        action: 'ACCOUNT_REJECTED',
        module: 'Account Management',
        recordId: id,
        oldValue: { accountStatus: existingUser.accountStatus },
        newValue: { accountStatus: 'Rejected' },
      });
      return NextResponse.json({ success: true, data: updated });
    }

    if (action === 'disable') {
      const updated = await UserService.update(id, { accountStatus: 'Disabled', isActive: false });
      await AuditService.log({
        userId: actorId || 'system',
        action: 'USER_DISABLED',
        module: 'Account Management',
        recordId: id,
        oldValue: { accountStatus: existingUser.accountStatus },
        newValue: { accountStatus: 'Disabled' },
      });
      return NextResponse.json({ success: true, data: updated });
    }

    if (action === 'reactivate') {
      const updated = await UserService.update(id, { accountStatus: 'Active', isActive: true });
      await AuditService.log({
        userId: actorId || 'system',
        action: 'USER_REACTIVATED',
        module: 'Account Management',
        recordId: id,
        oldValue: { accountStatus: existingUser.accountStatus },
        newValue: { accountStatus: 'Active' },
      });
      return NextResponse.json({ success: true, data: updated });
    }

    if (action === 'promote') {
      const updated = await UserService.update(id, { roleId: updateData.roleId });
      await AuditService.log({
        userId: actorId || 'system',
        action: 'ROLE_PROMOTED',
        module: 'Account Management',
        recordId: id,
        oldValue: { roleId: existingUser.roleId },
        newValue: { roleId: updateData.roleId },
      });
      return NextResponse.json({ success: true, data: updated });
    }

    if (action === 'delete') {
      if (existingUser.email.toLowerCase() === 'iversonwork039@gmail.com' || existingUser.email.toLowerCase() === 'admin@philfida.da.gov.ph') {
        return NextResponse.json({ error: 'Primary IT / MIS Super Admin accounts cannot be deleted!' }, { status: 400 });
      }
      await UserService.delete(id);
      await AuditService.log({
        userId: actorId || 'system',
        action: 'USER_DELETED',
        module: 'Account Management',
        recordId: id,
        oldValue: { email: existingUser.email, roleId: existingUser.roleId, accountStatus: existingUser.accountStatus },
        newValue: null,
      });
      return NextResponse.json({ success: true, message: 'Account permanently deleted from system.' });
    }

    if (action === 'reset_password') {
      // Firebase password reset is handled client-side; this is an audit trail entry only
      await AuditService.log({
        userId: actorId || 'system',
        action: 'PASSWORD_RESET_REQUESTED',
        module: 'Account Management',
        recordId: id,
        oldValue: null,
        newValue: { email: existingUser.email },
      });
      return NextResponse.json({ success: true, message: 'Password reset audit logged.' });
    }

    // Legacy: toggle isActive
    if (typeof updateData.isActive === 'boolean') {
      const updated = await UserService.update(id, { isActive: updateData.isActive });
      return NextResponse.json({ success: true, data: updated });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to modify user', message: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existingUser = await UserService.getById(id);
    if (!existingUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (existingUser.email.toLowerCase() === 'iversonwork039@gmail.com' || existingUser.email.toLowerCase() === 'admin@philfida.da.gov.ph') {
      return NextResponse.json({ error: 'Primary IT / MIS Super Admin accounts cannot be deleted!' }, { status: 400 });
    }
    await UserService.delete(id);
    return NextResponse.json({ success: true, message: 'Account permanently deleted.' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete user', message: error.message }, { status: 500 });
  }
}
