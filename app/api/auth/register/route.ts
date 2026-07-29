/**
 * POST /api/auth/register
 * 
 * Dedicated Ground-Up Registration Workflow Endpoint
 * 1. Validates full registration payload.
 * 2. Checks for duplicate email accounts across users & employee directory.
 * 3. Initializes matching Employee Directory record with appropriate leave structure (Permanent vs COS/JO).
 * 4. Creates User account with 'Pending' status and extensible multi-provider credentials.
 */
import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/services/user-service';
import { EmployeeService } from '@/lib/services/employee-service';
import { BootstrapService } from '@/lib/services/bootstrap-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      email, 
      displayName, 
      photoUrl, 
      authProvider = 'email', 
      position, 
      division, 
      office, 
      appointmentType = 'Permanent',
      emailVerified = false 
    } = body as {
      email: string;
      displayName?: string;
      photoUrl?: string;
      authProvider?: 'email' | 'google';
      position?: string;
      division?: string;
      office?: string;
      appointmentType?: 'Permanent' | 'COS / JO' | string;
      emailVerified?: boolean;
    };

    if (!email) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const provider: 'email' | 'google' = authProvider === 'google' ? 'google' : 'email';

    // 1. Check for existing user account (Duplicate Account Prevention)
    const existingUser = await UserService.getByEmail(normalizedEmail);
    if (existingUser) {
      const existingProvider = existingUser.authProvider || 'email';
      return NextResponse.json(
        {
          error: 'DUPLICATE_ACCOUNT',
          message: `An account with this email address already exists. Please sign in using ${existingProvider === 'google' ? 'Google Sign-In' : 'Email & Password'}.`,
        },
        { status: 409 }
      );
    }

    // 2. Build User Payload
    const payload = BootstrapService.buildNewUserPayload({
      email: normalizedEmail,
      displayName: displayName || normalizedEmail.split('@')[0],
      authProvider: provider,
      photoUrl,
    });

    // Super Admin override check
    const isSuperAdmin = normalizedEmail === 'iversonwork039@gmail.com' || payload.roleId === 'role_superadmin';

    // 3. Create or Link Employee Record
    const allEmps = await EmployeeService.getAll();
    let matchingEmp = allEmps.find(e => e.email.toLowerCase() === normalizedEmail);

    if (!matchingEmp && !isSuperAdmin) {
      const nameParts = (displayName || normalizedEmail.split('@')[0]).trim().split(' ');
      const firstName = nameParts[0] || 'Employee';
      const lastName = nameParts.slice(1).join(' ') || 'Staff';

      matchingEmp = await EmployeeService.create({
        employeeNumber: `EMP-${Math.floor(100000 + Math.random() * 900000)}`,
        firstName,
        lastName,
        email: normalizedEmail,
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

    // Assign extensible provider array & email verification status
    payload.authProvider = authProvider;
    payload.authProviders = [authProvider];
    payload.emailVerified = authProvider === 'google' ? true : emailVerified;

    // 4. Create User Record in Database
    const newUser = await UserService.create(payload);

    return NextResponse.json({
      success: true,
      pending: newUser.accountStatus === 'Pending',
      emailVerificationRequired: !payload.emailVerified,
      message: 'Registration successful! Your account is pending administrator approval.',
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        roleId: newUser.roleId,
        accountStatus: newUser.accountStatus,
        emailVerified: newUser.emailVerified,
        authProviders: newUser.authProviders,
        employeeId: matchingEmp?.id,
        employeeName: matchingEmp ? `${matchingEmp.firstName} ${matchingEmp.lastName}` : newUser.displayName,
        office: matchingEmp?.office,
        division: matchingEmp?.division,
        position: matchingEmp?.position,
      },
    }, { status: 201 });

  } catch (error: any) {
    console.error('Registration API Error:', error);
    return NextResponse.json(
      { error: 'Registration failed', message: error.message || 'Server error processing registration' },
      { status: 500 }
    );
  }
}
