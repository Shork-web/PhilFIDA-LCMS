// PhilFIDA Leave Credit Management System (PLCMS) Constants

import { PermissionKey, PhilFIDAOffice, PhilFIDADivision } from '@/types';

export const PHILFIDA_OFFICES = [
  'PhilFIDA Regional Office VII - Cebu HQ',
  'PhilFIDA Region VII - Bohol Satellite Station',
  'PhilFIDA Region VII - Negros Oriental Station',
  'PhilFIDA Region VII - Siquijor Field Office',
] as const;

export const PHILFIDA_DIVISIONS = [
  // Support Division
  'AFMD - Admin Finance and Management Division',
  'Planning Division',
  'MIS - Management Information System',
  // Operations Division
  'FUTD - Fiber Utilization and Technology Division',
  'Research Division',
  'Regulatory Division',
  'TAD - Technical Assistance Division',
] as const;


export const APPOINTMENT_TYPES = [
  'Permanent',
  'Casual',
  'Coterminous',
  'Contractual',
  'Job Order',
  'Elective',
] as const;

export const EMPLOYMENT_STATUSES = [
  'Active',
  'Inactive',
  'On Leave',
  'Retired',
  'Resigned',
] as const;

// Granular System Permissions Grouped for Role Management Matrix UI
export interface PermissionGroup {
  category: string;
  permissions: Array<{
    key: PermissionKey;
    label: string;
    description: string;
  }>;
}

export const SYSTEM_PERMISSIONS: PermissionGroup[] = [
  {
    category: 'Employee Management',
    permissions: [
      { key: 'employees.view', label: 'View Employees', description: 'Can view employee directory and profiles' },
      { key: 'employees.create', label: 'Create Employee', description: 'Can add new employees to the agency' },
      { key: 'employees.edit', label: 'Edit Employee', description: 'Can update employee details' },
      { key: 'employees.deactivate', label: 'Deactivate Employee', description: 'Can toggle employee active status' },
    ],
  },
  {
    category: 'User Account Management',
    permissions: [
      { key: 'users.view', label: 'View Users', description: 'Can view user accounts' },
      { key: 'users.create', label: 'Create User Account', description: 'Can create login credentials for employees' },
      { key: 'users.edit', label: 'Edit User Account', description: 'Can update user parameters and roles' },
      { key: 'users.deactivate', label: 'Activate/Deactivate User', description: 'Can enable or disable user accounts' },
      { key: 'users.reset_password', label: 'Reset User Password', description: 'Can issue password reset requests' },
    ],
  },
  {
    category: 'Role & Access Control',
    permissions: [
      { key: 'roles.view', label: 'View Roles', description: 'Can view system roles and permissions' },
      { key: 'roles.create', label: 'Create Role', description: 'Can create custom roles' },
      { key: 'roles.edit', label: 'Edit Role Permissions', description: 'Can update permission sets for roles' },
      { key: 'roles.delete', label: 'Delete Role', description: 'Can remove non-system custom roles' },
    ],
  },
  {
    category: 'Leave Type & Credit Management',
    permissions: [
      { key: 'leave_types.view', label: 'View Leave Types', description: 'Can view leave categories' },
      { key: 'leave_types.create', label: 'Create Leave Type', description: 'Can define new CSC leave categories' },
      { key: 'leave_types.edit', label: 'Edit Leave Type', description: 'Can update leave descriptions and rules' },
      { key: 'leave_types.toggle', label: 'Toggle Leave Type Status', description: 'Can enable or disable leave types' },
      { key: 'leave_balances.view_all', label: 'View All Employee Balances', description: 'Can view leave balances of all agency staff' },
      { key: 'leave_balances.edit', label: 'Adjust Leave Balances', description: 'Can manually adjust leave credit balances' },
    ],
  },
  {
    category: 'Leave Applications & Workflow',
    permissions: [
      { key: 'leave_applications.view_own', label: 'View Own Applications', description: 'Can view own leave applications' },
      { key: 'leave_applications.view_all', label: 'View All Applications', description: 'Can view leave requests of all staff' },
      { key: 'leave_applications.create', label: 'Apply for Leave', description: 'Can submit new leave application' },
      { key: 'leave_applications.approve', label: 'Approve/Reject Leave', description: 'Can process leave applications' },
      { key: 'leave_applications.cancel', label: 'Cancel Application', description: 'Can cancel pending leave application' },
    ],
  },
  {
    category: 'Compensatory Time Off (CTO)',
    permissions: [
      { key: 'cto.view_own', label: 'View Own CTO', description: 'Can view own CTO claims' },
      { key: 'cto.view_all', label: 'View All CTO Requests', description: 'Can view all CTO requests across agency' },
      { key: 'cto.create', label: 'Submit CTO Request', description: 'Can submit earned CTO hours' },
      { key: 'cto.approve', label: 'Approve/Reject CTO', description: 'Can approve and convert CTO hours to credits' },
    ],
  },
  {
    category: 'Audit & Ledger',
    permissions: [
      { key: 'leave_adjustments.create', label: 'Create Manual Adjustment', description: 'Can issue manual credit/debit adjustments' },
      { key: 'leave_adjustments.view', label: 'View Manual Adjustments', description: 'Can view adjustment records' },
      { key: 'leave_ledger.view', label: 'View Leave Ledger', description: 'Can view transaction history ledger' },
      { key: 'audit_logs.view', label: 'View Audit Logs', description: 'Can inspect system audit logs' },
    ],
  },
  {
    category: 'Automation, Settings & Reporting',
    permissions: [
      { key: 'settings.manage', label: 'Manage System Settings', description: 'Can configure credit rules, thresholds, and policies' },
      { key: 'holidays.manage', label: 'Manage Holidays', description: 'Can add, edit, or remove official public holidays' },
      { key: 'reports.view', label: 'Generate & View Reports', description: 'Can generate leave cards, ledger reports, and summaries' },
      { key: 'accrual.manage', label: 'Manage Monthly Accrual', description: 'Can run and preview monthly leave credit accruals' },
      { key: 'notifications.view', label: 'View Notifications', description: 'Can view system notifications' },
      { key: 'calendar.view', label: 'View Leave Calendar', description: 'Can access interactive agency leave calendar' },
    ],
  },
  {
    category: 'Dashboards & Self Service',
    permissions: [
      { key: 'dashboard.admin_view', label: 'Admin/HR Dashboard', description: 'Access to agency-wide statistics and charts' },
      { key: 'dashboard.employee_view', label: 'Employee Portal Dashboard', description: 'Access to personal employee dashboard' },
      { key: 'profile.view_own', label: 'View Own Profile', description: 'Access to personal profile details and balances' },
    ],
  },
];

export const SUPER_ADMIN_PERMISSIONS: PermissionKey[] = [
  'employees.view',
  'employees.create',
  'employees.edit',
  'employees.deactivate',
  'users.view',
  'users.create',
  'users.edit',
  'users.deactivate',
  'users.reset_password',
  'roles.view',
  'roles.create',
  'roles.edit',
  'roles.delete',
  'leave_types.view',
  'leave_types.create',
  'leave_types.edit',
  'leave_types.toggle',
  'leave_balances.view_all',
  'leave_balances.edit',
  'leave_applications.view_own',
  'leave_applications.view_all',
  'leave_applications.create',
  'leave_applications.approve',
  'leave_applications.cancel',
  'cto.view_own',
  'cto.view_all',
  'cto.create',
  'cto.approve',
  'leave_adjustments.create',
  'leave_adjustments.view',
  'leave_ledger.view',
  'audit_logs.view',
  'settings.manage',
  'holidays.manage',
  'reports.view',
  'accrual.manage',
  'notifications.view',
  'calendar.view',
  'dashboard.admin_view',
  'dashboard.employee_view',
  'profile.view_own',
];

export const HR_ADMIN_PERMISSIONS: PermissionKey[] = [
  'employees.view',
  'employees.create',
  'employees.edit',
  'employees.deactivate',
  'leave_types.view',
  'leave_types.create',
  'leave_types.edit',
  'leave_types.toggle',
  'leave_balances.view_all',
  'leave_balances.edit',
  'leave_applications.view_own',
  'leave_applications.view_all',
  'leave_applications.create',
  'leave_applications.approve',
  'leave_applications.cancel',
  'cto.view_own',
  'cto.view_all',
  'cto.create',
  'cto.approve',
  'leave_adjustments.create',
  'leave_adjustments.view',
  'leave_ledger.view',
  'audit_logs.view',
  'holidays.manage',
  'reports.view',
  'accrual.manage',
  'notifications.view',
  'calendar.view',
  'dashboard.admin_view',
  'dashboard.employee_view',
  'profile.view_own',
];

export const EMPLOYEE_PERMISSIONS: PermissionKey[] = [
  'dashboard.employee_view',
  'profile.view_own',
  'leave_applications.view_own',
  'leave_applications.create',
  'leave_applications.cancel',
  'cto.view_own',
  'cto.create',
  'reports.view',
  'notifications.view',
  'calendar.view',
];

// Default System Settings Configuration
export const DEFAULT_SYSTEM_SETTINGS = {
  id: 'sys_config_default',
  monthlyVacationLeave: 1.25,
  monthlySickLeave: 1.25,
  ctoHoursPerDay: 8,
  allowNegativeBalance: false,
  requireAttachmentAfterDays: 2,
  workingDaysPerWeek: 5,
  minimumLeaveDays: 0.5,
  maximumLeaveDays: 105,
  enableHalfDayLeave: true,
  enableHolidayValidation: true,
  enableAutomaticMonthlyCredits: true,
  createdAt: '2026-01-01T08:00:00.000Z',
  updatedAt: '2026-01-01T08:00:00.000Z',
};


// Configurable CTO Settings
export const CTO_CONVERSION_SETTINGS = {
  HOURS_PER_DAY: 8,
  CREDITS_PER_HOUR: 0.125, // 1 hour worked = 0.125 day credits (8 hrs = 1 full day)
};


// Official PhilFIDA / CSC Standard Leave Types
export const INITIAL_LEAVE_TYPES = [
  {
    code: 'VL',
    leaveName: 'Vacation Leave',
    description: 'Leave taken for personal reasons, vacation, or rest. Earned at 1.25 days per month of service.',
    isActive: true,
    defaultCreditsPerYear: 15,
  },
  {
    code: 'SL',
    leaveName: 'Sick Leave',
    description: 'Leave taken due to personal illness, injury, or medical appointment. Earned at 1.25 days per month.',
    isActive: true,
    defaultCreditsPerYear: 15,
  },
  {
    code: 'SPL',
    leaveName: 'Special Privilege Leave',
    description: 'Non-cumulative 3-day annual leave for personal milestones, obligations, or emergency needs (CSC MC No. 6, s. 1998).',
    isActive: true,
    defaultCreditsPerYear: 3,
  },
  {
    code: 'FL',
    leaveName: 'Mandatory / Forced Leave',
    description: 'Annual 5-day mandatory vacation leave forfeited if not taken (CSC MC No. 41, s. 1998).',
    isActive: true,
    defaultCreditsPerYear: 5,
  },
  {
    code: 'ML',
    leaveName: 'Maternity Leave',
    description: '105 days paid leave for female employees following childbirth or miscarriage under RA 11210.',
    isActive: true,
    defaultCreditsPerYear: 105,
  },
  {
    code: 'PL',
    leaveName: 'Paternity Leave',
    description: '7 days paid leave for married male employees for childbirth of legitimate spouse under RA 8187.',
    isActive: true,
    defaultCreditsPerYear: 7,
  },
  {
    code: 'SOLO',
    leaveName: 'Solo Parent Leave',
    description: '7 days parental leave granted to solo parents under RA 8972 / RA 11861.',
    isActive: true,
    defaultCreditsPerYear: 7,
  },
  {
    code: 'VAWC',
    leaveName: '10-Day VAWC Leave',
    description: '10 days paid leave for female victims of violence under RA 9262.',
    isActive: true,
    defaultCreditsPerYear: 10,
  },
  {
    code: 'COMP',
    leaveName: 'Compensatory Overtime Credit (COC)',
    description: 'Earned accrued leave credits in lieu of overtime cash payment (CSC-DBM Joint Circular No. 2, s. 2004).',
    isActive: true,
    defaultCreditsPerYear: 0,
  },
];
