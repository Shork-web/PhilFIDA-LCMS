/**
 * POST /api/auth/login
 * 
 * Called by the client AFTER Firebase authentication succeeds.
 * Receives the Firebase UID + user profile, then:
 * 1. Looks up the existing PLCMS user record by email.
 * 2. If none exists, creates one (Pending status, Employee role) — or Super Admin if first user.
 * 3. Checks account status: blocks Pending, Disabled, Rejected.
 * 4. Returns the AuthUser payload for the Zustand store.
 */
import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/services/user-service';
import { EmployeeService } from '@/lib/services/employee-service';
import { RoleService } from '@/lib/services/role-service';
import { BootstrapService } from '@/lib/services/bootstrap-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, displayName, photoUrl, authProvider, position, division, office, appointmentType } = body as {
      email: string;
      displayName?: string;
      photoUrl?: string;
      authProvider: 'email' | 'google';
      position?: string;
      division?: string;
      office?: string;
      appointmentType?: string;
    };

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Find existing user record
    let user = await UserService.getByEmail(email);

    // If user doesn't exist, create one (all new sign-ups default to Staff + Pending status)
    if (!user) {
      const payload = BootstrapService.buildNewUserPayload({
        email,
        displayName: displayName || email.split('@')[0],
        authProvider: authProvider || 'email',
        photoUrl,
      });

      // Automatically create matching Employee record for non-superadmin accounts so they reflect in the Employee Directory
      const isSuperAdmin = email.toLowerCase() === 'iversonwork039@gmail.com' || payload.roleId === 'role_superadmin';
      
      const allEmps = await EmployeeService.getAll();
      let matchingEmp = allEmps.find(e => e.email.toLowerCase() === email.toLowerCase());

      if (!matchingEmp && !isSuperAdmin) {
        const nameParts = (displayName || email.split('@')[0]).trim().split(' ');
        const firstName = nameParts[0] || 'Employee';
        const lastName = nameParts.slice(1).join(' ') || 'Staff';
        matchingEmp = await EmployeeService.create({
          employeeNumber: `EMP-${Math.floor(100000 + Math.random() * 900000)}`,
          firstName,
          lastName,
          email,
          contactNumber: 'N/A',
          position: position || 'Employee - Staff',
          office: office || 'PhilFIDA Regional Office VII - Cebu HQ',
          division: division || 'AFMD - Admin Finance and Management Division',
          appointmentType: appointmentType || 'Permanent',
          employmentStatus: 'Active',
          appointmentDate: new Date().toISOString().split('T')[0],
          isActive: true,
        });
      }

      if (matchingEmp && !isSuperAdmin) {
        payload.employeeId = matchingEmp.id;
      }

      user = await UserService.create(payload);
    } else {
      // Sync photo/displayName if changed (Google sign-in) or link employee if missing
      let updates: Record<string, any> = {};
      if (photoUrl && photoUrl !== user.photoUrl) {
        updates.photoUrl = photoUrl;
        updates.displayName = displayName || user.displayName;
      }
      if (!user.employeeId) {
        const allEmps = await EmployeeService.getAll();
        const matchingEmp = allEmps.find(e => e.email.toLowerCase() === email.toLowerCase());
        if (matchingEmp) {
          updates.employeeId = matchingEmp.id;
        }
      }
      if (Object.keys(updates).length > 0) {
        user = (await UserService.update(user.id, updates)) || user;
      }
    }

    // --- Account Status Enforcement ---
    if (user.accountStatus === 'Pending') {
      const role = user.roleId ? await RoleService.getById(user.roleId) : null;
      const pendingEmployee = user.employeeId ? await EmployeeService.getById(user.employeeId) : null;
      // Return fully-shaped AuthUser so client-side setAuth() works correctly
      return NextResponse.json(
        {
          error: 'ACCOUNT_PENDING',
          message: 'Your account is pending administrator approval. You will be notified once approved.',
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            roleId: user.roleId,
            roleName: role?.roleName || 'Staff (Employee)',
            permissions: role?.permissions || [],
            accountStatus: user.accountStatus,
            employeeId: pendingEmployee?.id,
            employeeName: pendingEmployee
              ? `${pendingEmployee.firstName} ${pendingEmployee.lastName}`
              : user.displayName || user.username,
            office: pendingEmployee?.office,
            division: pendingEmployee?.division,
            position: pendingEmployee?.position,
            photoUrl: user.photoUrl,
          },
        },
        { status: 403 }
      );
    }

    if (user.accountStatus === 'Disabled') {
      return NextResponse.json(
        { error: 'ACCOUNT_DISABLED', message: 'Your account has been disabled. Please contact the HR Administrator.' },
        { status: 403 }
      );
    }

    if (user.accountStatus === 'Rejected') {
      return NextResponse.json(
        { error: 'ACCOUNT_REJECTED', message: 'Your registration has been rejected. Please contact the HR Administrator.' },
        { status: 403 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'ACCOUNT_INACTIVE', message: 'User account is deactivated. Please contact your HR Administrator.' },
        { status: 403 }
      );
    }

    // Fetch associated records
    const employee = user.employeeId ? await EmployeeService.getById(user.employeeId) : null;
    const role = user.roleId ? await RoleService.getById(user.roleId) : null;

    const authUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      roleId: user.roleId,
      roleName: role?.roleName || 'Employee',
      permissions: role?.permissions || [],
      accountStatus: user.accountStatus,
      employeeId: employee?.id,
      employeeName: employee
        ? `${employee.firstName} ${employee.lastName}`
        : user.displayName || user.username,
      employeeNumber: employee?.employeeNumber,
      office: employee?.office,
      division: employee?.division,
      position: employee?.position,
      photoUrl: user.photoUrl,
    };

    return NextResponse.json({
      success: true,
      user: authUser,
      token: `plcms_token_${user.id}_${Date.now()}`,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Authentication failed', message: error.message },
      { status: 500 }
    );
  }
}
