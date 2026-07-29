// PhilFIDA Leave Credit Management System (PLCMS) Type Definitions

export type EmploymentStatus = 'Active' | 'Inactive' | 'On Leave' | 'Retired' | 'Resigned';

export type AppointmentType = 
  | 'Permanent' 
  | 'Casual' 
  | 'Coterminous' 
  | 'Contractual' 
  | 'Job Order' 
  | 'Elective';

export type PhilFIDAOffice = 
  | 'Central Office (Quezon City)'
  | 'Regional Office I (Ilocos)'
  | 'Regional Office II (Cagayan Valley)'
  | 'Regional Office III (Central Luzon)'
  | 'Regional Office IV (CALABARZON/MIMAROPA)'
  | 'Regional Office V (Bicol Region)'
  | 'Regional Office VI (Western Visayas)'
  | 'Regional Office VII (Central Visayas)'
  | 'Regional Office VIII (Eastern Visayas)'
  | 'Regional Office IX (Zamboanga Peninsula)'
  | 'Regional Office X (Northern Mindanao)'
  | 'Regional Office XI (Davao Region)'
  | 'Regional Office XII (SOCCSKSARGEN)'
  | 'Regional Office XIII (Caraga)';

export type PhilFIDADivision = 
  | 'Office of the Executive Director (OED)'
  | 'Administrative Division'
  | 'Finance and Management Division (FMD)'
  | 'Fiber Development and Extension Division (FDED)'
  | 'Research and Development Division (RDD)'
  | 'Regulatory Division'
  | 'Planning and Statistics Division (PSD)'
  | 'Information Technology Unit (ITU)';

// Employee Entity
export interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  email: string;
  contactNumber: string;
  office: PhilFIDAOffice | string;
  division: PhilFIDADivision | string;
  position: string;
  appointmentType: AppointmentType | string;
  employmentStatus: EmploymentStatus;
  appointmentDate: string; // ISO date string (YYYY-MM-DD)
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// System Permission keys
export type PermissionKey =
  | 'employees.view'
  | 'employees.create'
  | 'employees.edit'
  | 'employees.deactivate'
  | 'users.view'
  | 'users.create'
  | 'users.edit'
  | 'users.deactivate'
  | 'users.reset_password'
  | 'roles.view'
  | 'roles.create'
  | 'roles.edit'
  | 'roles.delete'
  | 'leave_types.view'
  | 'leave_types.create'
  | 'leave_types.edit'
  | 'leave_types.toggle'
  | 'leave_balances.view_all'
  | 'leave_balances.edit'
  | 'leave_applications.view_own'
  | 'leave_applications.view_all'
  | 'leave_applications.create'
  | 'leave_applications.approve'
  | 'leave_applications.cancel'
  | 'cto.view_own'
  | 'cto.view_all'
  | 'cto.create'
  | 'cto.approve'
  | 'leave_adjustments.create'
  | 'leave_adjustments.view'
  | 'leave_ledger.view'
  | 'audit_logs.view'
  | 'settings.manage'
  | 'holidays.manage'
  | 'reports.view'
  | 'accrual.manage'
  | 'notifications.view'
  | 'calendar.view'
  | 'documents.manage'
  | 'data.export'
  | 'dashboard.admin_view'
  | 'dashboard.employee_view'
  | 'profile.view_own';


// Role Entity
export interface Role {
  id: string;
  roleName: string;
  description: string;
  permissions: PermissionKey[];
  isSystemRole?: boolean;
  createdAt: string;
  updatedAt: string;
}

// User Entity
export type AccountStatus = 'Pending' | 'Active' | 'Rejected' | 'Disabled';

export interface User {
  id: string;
  employeeId?: string; // optional — linked after approval
  username: string;
  email: string;
  roleId: string;
  isActive: boolean;
  accountStatus: AccountStatus;
  authProvider?: 'email' | 'google' | string;
  authProviders?: Array<'email' | 'google' | string>;
  emailVerified?: boolean;
  emailVerificationSentAt?: string;
  photoUrl?: string;
  displayName?: string;
  createdAt: string;
  updatedAt: string;
  
  // Joined fields for display
  employee?: Employee;
  role?: Role;
}

// Leave Type Entity (CSC aligned)
export interface LeaveType {
  id: string;
  code: string; // e.g. "VL", "SL", "SPL"
  leaveName: string; // e.g. "Vacation Leave"
  description: string;
  isActive: boolean;
  defaultCreditsPerYear?: number;
  createdAt: string;
  updatedAt: string;
}

// Leave Balance Entity
export interface LeaveBalance {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  balance: number;
  lastUpdated: string;
  
  // Joined field
  leaveType?: LeaveType;
}

// --- PHASE 2 ENTITIES ---

export type TransactionType = 'Credit' | 'Debit' | 'Adjustment' | 'Reversal';

export type TransactionSource = 
  | 'Beginning Balance' 
  | 'Leave Application' 
  | 'Manual Adjustment' 
  | 'CTO' 
  | 'Monthly Accrual' 
  | 'System';

export interface LeaveTransaction {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  transactionType: TransactionType;
  source: TransactionSource;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  referenceId: string;
  remarks: string;
  createdBy: string;
  createdAt: string;

  // Joined fields for display
  employee?: Employee;
  leaveType?: LeaveType;
}

export type LeaveApplicationStatus = 'Pending' | 'Supervisor Approved' | 'Approved' | 'Rejected' | 'Cancelled';

export interface LeaveApplication {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  numberOfDays: number;
  reason: string;
  attachmentUrl?: string;
  status: LeaveApplicationStatus;
  supervisorId?: string;
  supervisorRemarks?: string;
  supervisorApprovedAt?: string;
  approverId?: string;
  approvalRemarks?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;

  // Joined fields for display
  employee?: Employee;
  leaveType?: LeaveType;
  supervisor?: Employee;
  approver?: Employee;
}

export type CTOStatus = 'Pending' | 'Supervisor Approved' | 'Approved' | 'Rejected';

export interface CTORequest {
  id: string;
  employeeId: string;
  dateWorked: string; // YYYY-MM-DD
  hoursWorked: number;
  equivalentLeave: number; // calculated day credits (e.g., 8 hrs = 1 day credit)
  reason: string;
  attachmentUrl?: string;
  status: CTOStatus;
  supervisorId?: string;
  supervisorRemarks?: string;
  supervisorApprovedAt?: string;
  approverId?: string;
  approvalRemarks?: string;
  approvedAt?: string;
  createdAt: string;

  // Joined fields
  employee?: Employee;
  supervisor?: Employee;
  approver?: Employee;
}


export type AdjustmentType = 'Credit' | 'Debit';

export interface LeaveAdjustment {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  adjustmentType: AdjustmentType;
  amount: number;
  reason: string;
  attachmentUrl?: string;
  createdBy: string;
  createdAt: string;

  // Joined fields
  employee?: Employee;
  leaveType?: LeaveType;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  module: string;
  recordId: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  createdAt: string;

  // Joined field
  user?: User;
}

// --- PHASE 3 ENTITIES ---

export interface SystemSettings {
  id: string;
  monthlyVacationLeave: number; // default: 1.25
  monthlySickLeave: number; // default: 1.25
  ctoHoursPerDay: number; // default: 8
  allowNegativeBalance: boolean;
  requireAttachmentAfterDays: number; // default: 2
  workingDaysPerWeek: number; // default: 5
  minimumLeaveDays: number; // default: 0.5
  maximumLeaveDays: number; // default: 105
  enableHalfDayLeave: boolean;
  enableHolidayValidation: boolean;
  enableAutomaticMonthlyCredits: boolean;
  createdAt: string;
  updatedAt: string;
}

export type HolidayType = 'Regular' | 'Special' | 'Local';

export interface Holiday {
  id: string;
  holidayName: string;
  holidayType: HolidayType;
  date: string; // YYYY-MM-DD
  region?: string; // Optional regional scope
  isRecurring: boolean;
  createdAt: string;
}

export type NotificationType = 
  | 'Leave Approved' 
  | 'Leave Rejected' 
  | 'CTO Approved' 
  | 'Manual Adjustment' 
  | 'Monthly Accrual' 
  | 'System';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface MonthlyAccrualLog {
  id: string;
  employeeId: string;
  month: number; // 1-12
  year: number; // e.g. 2026
  vacationCredited: number;
  sickCredited: number;
  processedBy: string;
  processedAt: string;
  status: 'Success' | 'Failed';

  // Joined field
  employee?: Employee;
}

export interface GeneratedReport {
  id: string;
  reportName: string;
  generatedBy: string;
  dateGenerated: string;
  fileUrl?: string;
}

export interface DocumentRecord {
  id: string;
  title: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  category: 'Leave Attachment' | 'CTO Document' | 'Report' | 'Employee File' | 'Other';
  employeeId?: string;
  uploadedBy: string;
  isDeleted: boolean;
  createdAt: string;

  // Joined field
  employee?: Employee;
}

export interface ImportSummary {
  totalRows: number;
  validRows: number;
  duplicateCount: number;
  errorCount: number;
  errors: Array<{ row: number; field: string; message: string }>;
}

// Auth State

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  roleId: string;
  roleName: string;
  permissions: PermissionKey[];
  accountStatus: AccountStatus;
  employeeId?: string;
  employeeName?: string;
  employeeNumber?: string;
  office?: string;
  division?: string;
  position?: string;
  photoUrl?: string;
}

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  totalUsers: number;
  activeUsers: number;
  totalLeaveTypes: number;
  activeLeaveTypes: number;
  totalRoles: number;
  divisionCounts: Record<string, number>;
  officeCounts: Record<string, number>;
  recentActivities: Array<{
    id: string;
    action: string;
    description: string;
    actor: string;
    timestamp: string;
  }>;
}


