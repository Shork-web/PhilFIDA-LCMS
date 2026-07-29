import { NextRequest, NextResponse } from 'next/server';
import { employeeSchema } from '@/lib/validations/schemas';
import { EmployeeService } from '@/lib/services/employee-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const office = searchParams.get('office') || '';
    const division = searchParams.get('division') || '';
    const status = searchParams.get('status') || '';

    let employees = await EmployeeService.getAll();

    // Exclude Super Admin system accounts from Employee Directory
    const superAdminEmails = new Set(['iversonwork039@gmail.com']);
    employees = employees.filter(e => !superAdminEmails.has(e.email.toLowerCase()));

    if (search) {
      const q = search.toLowerCase();
      employees = employees.filter(
        (e) =>
          e.firstName.toLowerCase().includes(q) ||
          e.lastName.toLowerCase().includes(q) ||
          e.employeeNumber.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.position.toLowerCase().includes(q)
      );
    }

    if (office) {
      employees = employees.filter((e) => e.office === office);
    }

    if (division) {
      employees = employees.filter((e) => e.division === division);
    }

    if (status) {
      employees = employees.filter((e) => e.employmentStatus === status);
    }

    return NextResponse.json({ success: true, data: employees });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch employees', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = employeeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    // Create employee -> EmployeeService.create automatically triggers initial leave balances generation
    const newEmployee = await EmployeeService.create(result.data);

    return NextResponse.json(
      {
        success: true,
        message: 'Employee created successfully with initialized leave balances (0 default credits).',
        data: newEmployee,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to create employee', message: error.message },
      { status: 500 }
    );
  }
}
