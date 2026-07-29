import { z } from 'zod';

export const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, 'Username or Email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const employeeSchema = z.object({
  employeeNumber: z.string().min(3, 'Employee number must be at least 3 characters'),
  firstName: z.string().min(2, 'First name is required'),
  middleName: z.string().optional(),
  lastName: z.string().min(2, 'Last name is required'),
  suffix: z.string().optional(),
  email: z.string().email('Invalid email address'),
  contactNumber: z.string().min(7, 'Contact number is required'),
  office: z.string().min(1, 'Office selection is required'),
  division: z.string().min(1, 'Division selection is required'),
  position: z.string().min(2, 'Position title is required'),
  appointmentType: z.string().min(1, 'Appointment type is required'),
  employmentStatus: z.enum(['Active', 'Inactive', 'On Leave', 'Retired', 'Resigned']),
  appointmentDate: z.string().min(1, 'Appointment date is required'),
  isActive: z.boolean(),
});

export const userSchema = z.object({
  employeeId: z.string().optional(),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  roleId: z.string().min(1, 'Role selection is required'),
  isActive: z.boolean(),
  accountStatus: z.enum(['Pending', 'Active', 'Rejected', 'Disabled']).optional(),
  displayName: z.string().optional(),
  authProvider: z.enum(['email', 'google']).optional(),
});

export const roleSchema = z.object({
  roleName: z.string().min(2, 'Role name must be at least 2 characters'),
  description: z.string().min(5, 'Description is required'),
  permissions: z.array(z.string()).min(1, 'At least one permission must be assigned'),
});

export const leaveTypeSchema = z.object({
  code: z.string().min(2, 'Leave code must be at least 2 characters').max(10),
  leaveName: z.string().min(3, 'Leave name is required'),
  description: z.string().min(5, 'Description is required'),
  isActive: z.boolean(),
  defaultCreditsPerYear: z.number().nonnegative(),
});

export const updateBalanceSchema = z.object({
  employeeId: z.string().min(1),
  leaveTypeId: z.string().min(1),
  balance: z.number().min(0, 'Balance cannot be negative'),
});

export const leaveApplicationSchema = z.object({
  employeeId: z.string().min(1, 'Employee is required'),
  leaveTypeId: z.string().min(1, 'Leave type is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  numberOfDays: z.number().positive('Number of days must be greater than zero'),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
  attachmentUrl: z.string().optional(),
});

export const leaveAdjustmentSchema = z.object({
  employeeId: z.string().min(1, 'Employee selection is required'),
  leaveTypeId: z.string().min(1, 'Leave type selection is required'),
  adjustmentType: z.enum(['Credit', 'Debit']),
  amount: z.number().positive('Adjustment amount must be positive'),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
  attachmentUrl: z.string().optional(),
});

export const ctoRequestSchema = z.object({
  employeeId: z.string().min(1, 'Employee is required'),
  dateWorked: z.string().min(1, 'Date worked is required'),
  hoursWorked: z.number().positive('Hours worked must be greater than zero'),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
  attachmentUrl: z.string().optional(),
});

export const approvalSchema = z.object({
  status: z.enum(['Approved', 'Rejected']),
  approvalRemarks: z.string().optional(),
});

export const systemSettingsSchema = z.object({
  monthlyVacationLeave: z.number().nonnegative(),
  monthlySickLeave: z.number().nonnegative(),
  ctoHoursPerDay: z.number().positive(),
  allowNegativeBalance: z.boolean(),
  requireAttachmentAfterDays: z.number().nonnegative(),
  workingDaysPerWeek: z.number().min(1).max(7),
  minimumLeaveDays: z.number().positive(),
  maximumLeaveDays: z.number().positive(),
  enableHalfDayLeave: z.boolean(),
  enableHolidayValidation: z.boolean(),
  enableAutomaticMonthlyCredits: z.boolean(),
});

export const holidaySchema = z.object({
  holidayName: z.string().min(2, 'Holiday name is required'),
  holidayType: z.enum(['Regular', 'Special', 'Local']),
  date: z.string().min(1, 'Date is required'),
  region: z.string().optional(),
  isRecurring: z.boolean(),
});

export const monthlyAccrualSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2000).max(2100),
  processedBy: z.string().optional(),
});


