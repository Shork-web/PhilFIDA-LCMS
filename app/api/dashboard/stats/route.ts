import { NextResponse } from 'next/server';
import { EmployeeService } from '@/lib/services/employee-service';
import { UserService } from '@/lib/services/user-service';
import { LeaveTypeService } from '@/lib/services/leave-type-service';
import { RoleService } from '@/lib/services/role-service';
import { AuditService } from '@/lib/services/audit-service';

export async function GET() {
  try {
    const employees = await EmployeeService.getAll();
    const users = await UserService.getAll();
    const leaveTypes = await LeaveTypeService.getAll();
    const roles = await RoleService.getAll();
    const auditLogs = await AuditService.getAll();

    const divisionCounts: Record<string, number> = {};
    const officeCounts: Record<string, number> = {};

    employees.forEach((emp) => {
      divisionCounts[emp.division] = (divisionCounts[emp.division] || 0) + 1;
      officeCounts[emp.office] = (officeCounts[emp.office] || 0) + 1;
    });

    // Map real audit logs to recentActivities format
    const recentActivities = (auditLogs || []).slice(-6).reverse().map(log => ({
      id: log.id,
      action: log.action.replace(/_/g, ' '),
      description: `${log.module}: ${log.action} (ID: ${log.recordId})`,
      actor: log.user?.displayName || log.user?.username || log.userId || 'System',
      timestamp: log.createdAt,
    }));

    const stats = {
      totalEmployees: employees.length,
      activeEmployees: employees.filter((e) => e.isActive).length,
      totalUsers: users.length,
      activeUsers: users.filter((u) => u.isActive).length,
      totalLeaveTypes: leaveTypes.length,
      activeLeaveTypes: leaveTypes.filter((l) => l.isActive).length,
      totalRoles: roles.length,
      divisionCounts,
      officeCounts,
      recentActivities,
    };

    return NextResponse.json({ success: true, data: stats });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to aggregate dashboard metrics', message: error.message }, { status: 500 });
  }
}
