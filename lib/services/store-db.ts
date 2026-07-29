// PhilFIDA Data Store Engine with Dual Mode (Firestore & Out-of-the-Box Local Seed Store)
import fs from 'fs';
import path from 'path';

const DB_FILE_PATH = path.join(process.cwd(), 'data', 'philfida_db_cache.json');
import { 
  Employee, 
  User, 
  Role, 
  LeaveType, 
  LeaveBalance, 
  LeaveTransaction, 
  LeaveApplication, 
  CTORequest, 
  LeaveAdjustment, 
  AuditLog, 
  SystemSettings,
  Holiday,
  HolidayType,
  Notification,
  NotificationType,
  MonthlyAccrualLog,
  GeneratedReport,
  DocumentRecord,
  TransactionType, 

  TransactionSource,
  LeaveApplicationStatus,
  CTOStatus
} from '@/types';
import { 
  SUPER_ADMIN_PERMISSIONS, 
  HR_ADMIN_PERMISSIONS, 
  EMPLOYEE_PERMISSIONS, 
  INITIAL_LEAVE_TYPES,
  CTO_CONVERSION_SETTINGS,
  DEFAULT_SYSTEM_SETTINGS
} from '@/lib/constants';
import { generateId } from '@/lib/utils';
import { db } from '@/lib/firebase/config';
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc 
} from 'firebase/firestore';

import { adminDb } from '@/lib/firebase/admin';

// --- FIRESTORE PERSISTENCE HELPERS ---
async function syncToFirestore(collectionName: string, docId: string, data: any) {
  const cleanData = JSON.parse(JSON.stringify(data));
  delete cleanData.employee;
  delete cleanData.role;
  delete cleanData.leaveType;
  delete cleanData.user;
  delete cleanData.approver;

  if (adminDb) {
    try {
      await adminDb.collection(collectionName).doc(docId).set(cleanData, { merge: true });
      return;
    } catch (err) {
      console.warn(`[Admin Firestore Sync] Failed ${collectionName}/${docId}:`, err);
    }
  }

  if (db) {
    try {
      await setDoc(doc(db, collectionName, docId), cleanData, { merge: true });
    } catch (err) {
      // Silently fall back to in-memory + local disk persistence
    }
  }
}

async function removeFromFirestore(collectionName: string, docId: string) {
  if (adminDb) {
    try {
      await adminDb.collection(collectionName).doc(docId).delete();
      return;
    } catch (err) {
      console.warn(`[Admin Firestore Delete] Failed ${collectionName}/${docId}:`, err);
    }
  }

  if (db) {
    try {
      await deleteDoc(doc(db, collectionName, docId));
    } catch (err) {
      // Silently fall back
    }
  }
}

// --- MINIMUM SYSTEM BOOTSTRAP DATA ---

export const INITIAL_ROLES: Role[] = [
  {
    id: 'role_superadmin',
    roleName: 'IT/MIS (Super Admin)',
    description: 'PhilFIDA Region VII IT/MIS Administrator with full system control, security, and technical configuration privileges.',
    permissions: SUPER_ADMIN_PERMISSIONS,
    isSystemRole: true,
    createdAt: '2026-01-01T08:00:00.000Z',
    updatedAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'role_hradmin',
    roleName: 'Admin / Administrative Unit',
    description: 'PhilFIDA Region VII Administrative Unit managing employees, leave card generation, credit balances, and approval processing.',
    permissions: HR_ADMIN_PERMISSIONS,
    isSystemRole: true,
    createdAt: '2026-01-01T08:00:00.000Z',
    updatedAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'role_supervisor',
    roleName: 'Regional Director (Supervisor)',
    description: 'PhilFIDA Regional Director / Endorsing Officer reviewing and approving employee leave and CTO requests.',
    permissions: [
      'dashboard.employee_view',
      'profile.view_own',
      'leave_applications.view_own',
      'leave_applications.view_all',
      'leave_applications.approve',
      'cto.view_own',
      'cto.view_all',
      'cto.approve',
      'reports.view',
      'calendar.view',
    ],
    isSystemRole: true,
    createdAt: '2026-01-01T08:00:00.000Z',
    updatedAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'role_employee',
    roleName: 'Staff (Employee)',
    description: 'PhilFIDA Regional Office VII Staff member with portal access to file leave applications, view leave balances, and print leave cards.',
    permissions: EMPLOYEE_PERMISSIONS,
    isSystemRole: true,
    createdAt: '2026-01-01T08:00:00.000Z',
    updatedAt: '2026-01-01T08:00:00.000Z',
  },
];

export const INITIAL_LEAVE_TYPES_LIST: LeaveType[] = INITIAL_LEAVE_TYPES.map((lt) => ({
  id: `lt_${lt.code.toLowerCase()}`,
  code: lt.code,
  leaveName: lt.leaveName,
  description: lt.description,
  isActive: lt.isActive,
  defaultCreditsPerYear: lt.defaultCreditsPerYear,
  createdAt: '2026-01-01T08:00:00.000Z',
  updatedAt: '2026-01-01T08:00:00.000Z',
}));

export const INITIAL_HOLIDAYS: Holiday[] = [
  { id: 'hol_01', holidayName: "New Year's Day", holidayType: 'Regular', date: '2026-01-01', isRecurring: true, createdAt: '2026-01-01T08:00:00.000Z' },
  { id: 'hol_02', holidayName: 'Maundy Thursday', holidayType: 'Regular', date: '2026-04-02', isRecurring: false, createdAt: '2026-01-01T08:00:00.000Z' },
  { id: 'hol_03', holidayName: 'Good Friday', holidayType: 'Regular', date: '2026-04-03', isRecurring: false, createdAt: '2026-01-01T08:00:00.000Z' },
  { id: 'hol_04', holidayName: 'Araw ng Kagitingan', holidayType: 'Regular', date: '2026-04-09', isRecurring: true, createdAt: '2026-01-01T08:00:00.000Z' },
  { id: 'hol_05', holidayName: 'Labor Day', holidayType: 'Regular', date: '2026-05-01', isRecurring: true, createdAt: '2026-01-01T08:00:00.000Z' },
  { id: 'hol_06', holidayName: 'Independence Day', holidayType: 'Regular', date: '2026-06-12', isRecurring: true, createdAt: '2026-01-01T08:00:00.000Z' },
  { id: 'hol_07', holidayName: 'National Heroes Day', holidayType: 'Regular', date: '2026-08-31', isRecurring: false, createdAt: '2026-01-01T08:00:00.000Z' },
  { id: 'hol_08', holidayName: "All Saints' Day", holidayType: 'Special', date: '2026-11-01', isRecurring: true, createdAt: '2026-01-01T08:00:00.000Z' },
  { id: 'hol_09', holidayName: 'Bonifacio Day', holidayType: 'Regular', date: '2026-11-30', isRecurring: true, createdAt: '2026-01-01T08:00:00.000Z' },
  { id: 'hol_10', holidayName: 'Christmas Day', holidayType: 'Regular', date: '2026-12-25', isRecurring: true, createdAt: '2026-01-01T08:00:00.000Z' },
  { id: 'hol_11', holidayName: 'Rizal Day', holidayType: 'Regular', date: '2026-12-30', isRecurring: true, createdAt: '2026-01-01T08:00:00.000Z' },
];

export const INITIAL_EMPLOYEES: Employee[] = [];

export const INITIAL_SYSTEM_USERS: User[] = [
  {
    id: 'user_it_admin_iverson',
    username: 'iversonwork039',
    email: 'iversonwork039@gmail.com',
    displayName: 'IT / MIS Administrator',
    roleId: 'role_superadmin',
    accountStatus: 'Active',
    isActive: true,
    authProvider: 'google',
    createdAt: '2026-01-01T08:00:00.000Z',
    updatedAt: '2026-01-01T08:00:00.000Z',
  },
];

class InMemoryDatabase {
  private employees: Map<string, Employee> = new Map();
  private users: Map<string, User> = new Map();
  private roles: Map<string, Role> = new Map();
  private leaveTypes: Map<string, LeaveType> = new Map();
  private leaveBalances: Map<string, LeaveBalance> = new Map();
  private leaveTransactions: Map<string, LeaveTransaction> = new Map();
  private leaveApplications: Map<string, LeaveApplication> = new Map();
  private ctoRequests: Map<string, CTORequest> = new Map();
  private leaveAdjustments: Map<string, LeaveAdjustment> = new Map();
  private auditLogs: Map<string, AuditLog> = new Map();
  private systemSettings: SystemSettings = { ...DEFAULT_SYSTEM_SETTINGS };
  private holidays: Map<string, Holiday> = new Map();
  private notifications: Map<string, Notification> = new Map();
  private monthlyAccrualLogs: Map<string, MonthlyAccrualLog> = new Map();
  private generatedReports: Map<string, GeneratedReport> = new Map();
  private documents: Map<string, DocumentRecord> = new Map();
  private initialized = false;

  constructor() {
    this.init();
  }

  private saveToDisk() {
    try {
      const data = {
        employees: Array.from(this.employees.values()),
        users: Array.from(this.users.values()),
        leaveBalances: Array.from(this.leaveBalances.values()),
        leaveTransactions: Array.from(this.leaveTransactions.values()),
        monthlyAccrualLogs: Array.from(this.monthlyAccrualLogs.values()),
      };
      const dir = path.dirname(DB_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
    } catch {
      // ignore
    }
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf8');
        const data = JSON.parse(raw);
        if (data) {
          if (Array.isArray(data.employees) && data.employees.length > 0) {
            data.employees.forEach((e: Employee) => this.employees.set(e.id, { ...e }));
          }
          if (Array.isArray(data.users) && data.users.length > 0) {
            data.users.forEach((u: User) => this.users.set(u.id, { ...u }));
          }
          if (Array.isArray(data.leaveBalances) && data.leaveBalances.length > 0) {
            data.leaveBalances.forEach((b: LeaveBalance) => this.leaveBalances.set(b.id, { ...b }));
          }
          if (Array.isArray(data.leaveTransactions) && data.leaveTransactions.length > 0) {
            data.leaveTransactions.forEach((t: LeaveTransaction) => this.leaveTransactions.set(t.id, { ...t }));
          }
          if (Array.isArray(data.monthlyAccrualLogs) && data.monthlyAccrualLogs.length > 0) {
            data.monthlyAccrualLogs.forEach((l: MonthlyAccrualLog) => this.monthlyAccrualLogs.set(l.id, { ...l }));
          }
        }
      }
    } catch {
      // ignore
    }
  }

  private async loadFromFirestore() {
    if (!adminDb && !db) return;

    const getCollectionData = async (collName: string): Promise<any[]> => {
      if (adminDb) {
        try {
          const snap = await adminDb.collection(collName).get();
          if (!snap.empty) {
            return snap.docs.map(d => d.data());
          }
        } catch {
          // ignore admin error
        }
      }
      if (db) {
        try {
          const snap = await getDocs(collection(db, collName));
          if (!snap.empty) {
            return snap.docs.map(d => d.data());
          }
        } catch {
          // ignore client error
        }
      }
      return [];
    };

    try {
      // 1. Roles
      const rolesData = await getCollectionData('roles');
      if (rolesData.length > 0) {
        rolesData.forEach(item => { if (item?.id) this.roles.set(item.id, item); });
      } else {
        INITIAL_ROLES.forEach(r => syncToFirestore('roles', r.id, r));
      }

      // 2. Leave Types
      const ltData = await getCollectionData('leaveTypes');
      if (ltData.length > 0) {
        ltData.forEach(item => { if (item?.id) this.leaveTypes.set(item.id, item); });
      } else {
        INITIAL_LEAVE_TYPES_LIST.forEach(lt => syncToFirestore('leaveTypes', lt.id, lt));
      }

      // 3. Holidays
      const holData = await getCollectionData('holidays');
      if (holData.length > 0) {
        holData.forEach(item => { if (item?.id) this.holidays.set(item.id, item); });
      } else {
        INITIAL_HOLIDAYS.forEach(h => syncToFirestore('holidays', h.id, h));
      }

      // 4. Users
      const usersData = await getCollectionData('users');
      if (usersData.length > 0) {
        usersData.forEach(item => { if (item?.id) this.users.set(item.id, item); });
      } else {
        INITIAL_SYSTEM_USERS.forEach(u => syncToFirestore('users', u.id, u));
      }

      // 5. Employees
      const empData = await getCollectionData('employees');
      empData.forEach(item => { if (item?.id) this.employees.set(item.id, item); });

      // 6. Leave Balances
      const balData = await getCollectionData('leaveBalances');
      balData.forEach(item => { if (item?.id) this.leaveBalances.set(item.id, item); });

      // 7. Leave Transactions
      const txData = await getCollectionData('leaveTransactions');
      txData.forEach(item => { if (item?.id) this.leaveTransactions.set(item.id, item); });

      // 8. Leave Applications
      const appData = await getCollectionData('leaveApplications');
      appData.forEach(item => { if (item?.id) this.leaveApplications.set(item.id, item); });

      // 9. CTO Requests
      const ctoData = await getCollectionData('ctoRequests');
      ctoData.forEach(item => { if (item?.id) this.ctoRequests.set(item.id, item); });

      // 10. Leave Adjustments
      const adjData = await getCollectionData('leaveAdjustments');
      adjData.forEach(item => { if (item?.id) this.leaveAdjustments.set(item.id, item); });

      // 11. Audit Logs
      const auditData = await getCollectionData('auditLogs');
      auditData.forEach(item => { if (item?.id) this.auditLogs.set(item.id, item); });

      // 12. Notifications
      const notifData = await getCollectionData('notifications');
      notifData.forEach(item => { if (item?.id) this.notifications.set(item.id, item); });

      // 13. Monthly Accrual Logs
      const accrualData = await getCollectionData('monthlyAccrualLogs');
      accrualData.forEach(item => { if (item?.id) this.monthlyAccrualLogs.set(item.id, item); });

      // 14. Generated Reports
      const reportData = await getCollectionData('generatedReports');
      reportData.forEach(item => { if (item?.id) this.generatedReports.set(item.id, item); });

      // 15. Documents
      const docData = await getCollectionData('documents');
      docData.forEach(item => { if (item?.id) this.documents.set(item.id, item); });

      // 16. System Settings
      const settingsData = await getCollectionData('systemSettings');
      settingsData.forEach(item => {
        if (item?.id === 'default') {
          this.systemSettings = { ...this.systemSettings, ...item };
        }
      });

      // Save merged state to local disk cache
      this.saveToDisk();
    } catch {
      // Fallback silently to disk cache
    }
  }

  private init() {
    if (this.initialized) return;

    // 1. Seed essential system reference data (roles, leave types, holidays, IT admin accounts)
    INITIAL_ROLES.forEach(r => this.roles.set(r.id, { ...r }));
    INITIAL_LEAVE_TYPES_LIST.forEach(lt => this.leaveTypes.set(lt.id, { ...lt }));
    INITIAL_HOLIDAYS.forEach(h => this.holidays.set(h.id, { ...h }));
    // Seed super admin accounts (they won't be overwritten when loadFromDisk merges)
    INITIAL_SYSTEM_USERS.forEach(u => this.users.set(u.id, { ...u }));

    // 2. Restore persisted user/employee data from disk (registered users survive restarts)
    this.loadFromDisk();

    // 3. Connect to Firebase Cloud Firestore for real-time live data sync
    this.loadFromFirestore();

    this.initialized = true;
  }

  /**
   * Manual utility — call this ONLY to explicitly wipe all transient data back to factory state.
   * NOT called automatically during startup.
   */
  public clearAllSampleData() {
    this.employees.clear();
    this.users.clear();
    this.leaveBalances.clear();
    this.leaveTransactions.clear();
    this.leaveApplications.clear();
    this.ctoRequests.clear();
    this.leaveAdjustments.clear();
    this.auditLogs.clear();
    this.notifications.clear();
    this.monthlyAccrualLogs.clear();
    this.generatedReports.clear();
    this.documents.clear();

    INITIAL_ROLES.forEach(r => this.roles.set(r.id, { ...r }));
    INITIAL_LEAVE_TYPES_LIST.forEach(lt => this.leaveTypes.set(lt.id, { ...lt }));
    INITIAL_HOLIDAYS.forEach(h => this.holidays.set(h.id, { ...h }));
    INITIAL_SYSTEM_USERS.forEach(u => this.users.set(u.id, { ...u }));

    this.saveToDisk();
  }


  // --- EMPLOYEES ---
  async getEmployees(): Promise<Employee[]> {
    return Array.from(this.employees.values());
  }

  async getEmployeeById(id: string): Promise<Employee | null> {
    return this.employees.get(id) || null;
  }

  async createEmployee(data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<Employee> {
    const id = generateId('emp');
    const now = new Date().toISOString();
    const newEmp: Employee = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.employees.set(id, newEmp);
    syncToFirestore('employees', id, newEmp);

    // Initialize default leave balances for new employee
    this.leaveTypes.forEach((lt) => {
      const balanceId = `lb_${id}_${lt.id}`;
      const lbRecord: LeaveBalance = {
        id: balanceId,
        employeeId: id,
        leaveTypeId: lt.id,
        balance: 0,
        lastUpdated: now,
      };
      this.leaveBalances.set(balanceId, lbRecord);
      syncToFirestore('leaveBalances', balanceId, lbRecord);
    });

    this.saveToDisk();
    return newEmp;
  }

  async updateEmployee(id: string, data: Partial<Employee>): Promise<Employee | null> {
    const existing = this.employees.get(id);
    if (!existing) return null;
    const updated: Employee = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    this.employees.set(id, updated);
    this.saveToDisk();
    syncToFirestore('employees', id, updated);
    return updated;
  }

  async toggleEmployeeStatus(id: string, isActive: boolean): Promise<Employee | null> {
    return this.updateEmployee(id, { isActive });
  }


  // --- USERS ---
  async getUsers(): Promise<User[]> {
    const list = Array.from(this.users.values());
    return list.map(u => ({
      ...u,
      employee: u.employeeId ? this.employees.get(u.employeeId) : undefined,
      role: this.roles.get(u.roleId),
    }));
  }

  async getUserById(id: string): Promise<User | null> {
    const u = this.users.get(id);
    if (!u) return null;
    return {
      ...u,
      employee: u.employeeId ? this.employees.get(u.employeeId) : undefined,
      role: this.roles.get(u.roleId),
    };
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const u = Array.from(this.users.values()).find(
      x => x.email.toLowerCase() === email.toLowerCase() || x.username.toLowerCase() === email.toLowerCase()
    );
    if (!u) return null;
    return {
      ...u,
      employee: u.employeeId ? this.employees.get(u.employeeId) : undefined,
      role: this.roles.get(u.roleId),
    };
  }

  async createUser(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const id = generateId('user');
    const now = new Date().toISOString();
    const newUser: User = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(id, newUser);
    this.saveToDisk();
    syncToFirestore('users', id, newUser);
    return {
      ...newUser,
      employee: newUser.employeeId ? this.employees.get(newUser.employeeId) : undefined,
      role: this.roles.get(newUser.roleId),
    };
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | null> {
    const existing = this.users.get(id);
    if (!existing) return null;
    const updated: User = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    this.users.set(id, updated);
    this.saveToDisk();
    syncToFirestore('users', id, updated);
    return {
      ...updated,
      employee: updated.employeeId ? this.employees.get(updated.employeeId) : undefined,
      role: this.roles.get(updated.roleId),
    };
  }

  async deleteUser(id: string): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) return false;
    if (user.email.toLowerCase() === 'iversonwork039@gmail.com') {
      throw new Error('Primary IT / MIS Super Admin accounts cannot be deleted!');
    }
    const success = this.users.delete(id);
    if (success) {
      this.saveToDisk();
      removeFromFirestore('users', id);
    }
    return success;
  }

  // --- ROLES ---
  async getRoles(): Promise<Role[]> {
    return Array.from(this.roles.values());
  }

  async getRoleById(id: string): Promise<Role | null> {
    return this.roles.get(id) || null;
  }

  async createRole(data: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Promise<Role> {
    const id = generateId('role');
    const now = new Date().toISOString();
    const newRole: Role = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.roles.set(id, newRole);
    syncToFirestore('roles', id, newRole);
    return newRole;
  }

  async updateRole(id: string, data: Partial<Role>): Promise<Role | null> {
    const existing = this.roles.get(id);
    if (!existing) return null;
    const updated: Role = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    this.roles.set(id, updated);
    syncToFirestore('roles', id, updated);
    return updated;
  }

  async deleteRole(id: string): Promise<boolean> {
    const existing = this.roles.get(id);
    if (!existing || existing.isSystemRole) return false;
    const deleted = this.roles.delete(id);
    if (deleted) {
      removeFromFirestore('roles', id);
    }
    return deleted;
  }

  // --- LEAVE TYPES ---
  async getLeaveTypes(): Promise<LeaveType[]> {
    return Array.from(this.leaveTypes.values());
  }

  async getLeaveTypeById(id: string): Promise<LeaveType | null> {
    return this.leaveTypes.get(id) || null;
  }

  async createLeaveType(data: Omit<LeaveType, 'id' | 'createdAt' | 'updatedAt'>): Promise<LeaveType> {
    const id = generateId('lt');
    const now = new Date().toISOString();
    const newLt: LeaveType = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.leaveTypes.set(id, newLt);
    syncToFirestore('leaveTypes', id, newLt);
    return newLt;
  }

  async updateLeaveType(id: string, data: Partial<LeaveType>): Promise<LeaveType | null> {
    const existing = this.leaveTypes.get(id);
    if (!existing) return null;
    const updated: LeaveType = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    this.leaveTypes.set(id, updated);
    syncToFirestore('leaveTypes', id, updated);
    return updated;
  }

  // --- LEAVE BALANCES ---
  async getLeaveBalancesByEmployee(employeeId: string): Promise<LeaveBalance[]> {
    const balances = Array.from(this.leaveBalances.values()).filter(b => b.employeeId === employeeId);
    return balances.map(b => ({
      ...b,
      leaveType: this.leaveTypes.get(b.leaveTypeId),
    }));
  }

  async getAllLeaveBalances(): Promise<LeaveBalance[]> {
    return Array.from(this.leaveBalances.values()).map(b => ({
      ...b,
      leaveType: this.leaveTypes.get(b.leaveTypeId),
    }));
  }

  async getLeaveBalance(employeeId: string, leaveTypeId: string): Promise<LeaveBalance | null> {
    const id = `lb_${employeeId}_${leaveTypeId}`;
    const lb = this.leaveBalances.get(id);
    if (!lb) return null;
    return {
      ...lb,
      leaveType: this.leaveTypes.get(leaveTypeId),
    };
  }

  async createLeaveBalance(data: { employeeId: string; leaveTypeId: string; balance: number }): Promise<LeaveBalance> {
    const id = `lb_${data.employeeId}_${data.leaveTypeId}`;
    const now = new Date().toISOString();
    const newBalance: LeaveBalance = {
      id,
      employeeId: data.employeeId,
      leaveTypeId: data.leaveTypeId,
      balance: data.balance,
      lastUpdated: now,
    };
    this.leaveBalances.set(id, newBalance);
    syncToFirestore('leaveBalances', id, newBalance);
    return {
      ...newBalance,
      leaveType: this.leaveTypes.get(data.leaveTypeId),
    };
  }

  async updateLeaveBalance(employeeId: string, leaveTypeId: string, newBalance: number): Promise<LeaveBalance | null> {
    const id = `lb_${employeeId}_${leaveTypeId}`;
    const existing = this.leaveBalances.get(id);
    const now = new Date().toISOString();

    if (!existing) {
      return this.createLeaveBalance({ employeeId, leaveTypeId, balance: newBalance });
    }

    const updated: LeaveBalance = {
      ...existing,
      balance: newBalance,
      lastUpdated: now,
    };
    this.leaveBalances.set(id, updated);
    syncToFirestore('leaveBalances', id, updated);
    return {
      ...updated,
      leaveType: this.leaveTypes.get(leaveTypeId),
    };
  }


  // --- CORE BANKING ENGINE & LEAVE TRANSACTIONS ---
  /**
   * Leave balances are NEVER edited directly.
   * Every balance change MUST create a LeaveTransaction.
   */
  async executeLeaveTransaction(params: {
    employeeId: string;
    leaveTypeId: string;
    transactionType: TransactionType;
    source: TransactionSource;
    amount: number;
    referenceId: string;
    remarks: string;
    createdBy: string;
  }): Promise<LeaveTransaction> {
    const { employeeId, leaveTypeId, transactionType, source, amount, referenceId, remarks, createdBy } = params;

    if (amount <= 0) {
      throw new Error('Transaction amount must be greater than zero.');
    }

    const balanceId = `lb_${employeeId}_${leaveTypeId}`;
    let existingBalanceRecord = this.leaveBalances.get(balanceId);
    const balanceBefore = existingBalanceRecord ? existingBalanceRecord.balance : 0;
    
    let balanceAfter = balanceBefore;
    if (transactionType === 'Credit') {
      balanceAfter = balanceBefore + amount;
    } else if (transactionType === 'Debit') {
      balanceAfter = balanceBefore - amount;
    } else if (transactionType === 'Adjustment') {
      // Amount can be positive or negative inside adjustment caller, but passed as magnitude + transactionType
      balanceAfter = balanceBefore + amount;
    } else if (transactionType === 'Reversal') {
      balanceAfter = balanceBefore + amount;
    }

    // Business Rule Enforcement: Balance cannot become negative
    if (balanceAfter < 0) {
      throw new Error(
        `Insufficient leave balance! Current balance is ${balanceBefore.toFixed(3)} days, but requested deduction is ${amount.toFixed(3)} days.`
      );
    }

    const now = new Date().toISOString();
    const txId = generateId('tx');

    // Create Immutable Transaction
    const transaction: LeaveTransaction = {
      id: txId,
      employeeId,
      leaveTypeId,
      transactionType,
      source,
      amount,
      balanceBefore,
      balanceAfter,
      referenceId,
      remarks,
      createdBy,
      createdAt: now,
    };

    this.leaveTransactions.set(txId, transaction);
    syncToFirestore('leaveTransactions', txId, transaction);

    // Update Leave Balance Computed Value
    const updatedBalance: LeaveBalance = {
      id: balanceId,
      employeeId,
      leaveTypeId,
      balance: balanceAfter,
      lastUpdated: now,
    };
    this.leaveBalances.set(balanceId, updatedBalance);
    syncToFirestore('leaveBalances', balanceId, updatedBalance);
    this.saveToDisk();

    return {
      ...transaction,
      employee: this.employees.get(employeeId),
      leaveType: this.leaveTypes.get(leaveTypeId),
    };
  }

  async getLeaveTransactions(filter?: {
    employeeId?: string;
    leaveTypeId?: string;
    transactionType?: string;
    source?: string;
  }): Promise<LeaveTransaction[]> {
    let list = Array.from(this.leaveTransactions.values());

    if (filter?.employeeId) {
      list = list.filter(t => t.employeeId === filter.employeeId);
    }
    if (filter?.leaveTypeId) {
      list = list.filter(t => t.leaveTypeId === filter.leaveTypeId);
    }
    if (filter?.transactionType) {
      list = list.filter(t => t.transactionType === filter.transactionType);
    }
    if (filter?.source) {
      list = list.filter(t => t.source === filter.source);
    }

    // Sort newest first
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return list.map(tx => ({
      ...tx,
      employee: this.employees.get(tx.employeeId),
      leaveType: this.leaveTypes.get(tx.leaveTypeId),
    }));
  }

  // --- LEAVE APPLICATIONS ---
  async getLeaveApplications(filter?: { employeeId?: string; status?: string }): Promise<LeaveApplication[]> {
    let list = Array.from(this.leaveApplications.values());

    if (filter?.employeeId) {
      list = list.filter(a => a.employeeId === filter.employeeId);
    }
    if (filter?.status) {
      list = list.filter(a => a.status === filter.status);
    }

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return list.map(app => ({
      ...app,
      employee: this.employees.get(app.employeeId),
      leaveType: this.leaveTypes.get(app.leaveTypeId),
      approver: app.approverId ? this.employees.get(app.approverId) : undefined,
    }));
  }

  async getLeaveApplicationById(id: string): Promise<LeaveApplication | null> {
    const app = this.leaveApplications.get(id);
    if (!app) return null;
    return {
      ...app,
      employee: this.employees.get(app.employeeId),
      leaveType: this.leaveTypes.get(app.leaveTypeId),
      approver: app.approverId ? this.employees.get(app.approverId) : undefined,
    };
  }

  async createLeaveApplication(data: Omit<LeaveApplication, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<LeaveApplication> {
    // 1. Check date overlap with existing non-rejected leave applications for same employee
    const existingApps = Array.from(this.leaveApplications.values()).filter(
      a => a.employeeId === data.employeeId && a.status !== 'Rejected' && a.status !== 'Cancelled'
    );

    const newStart = new Date(data.startDate).getTime();
    const newEnd = new Date(data.endDate).getTime();

    if (newEnd < newStart) {
      throw new Error('End date cannot be prior to start date.');
    }

    for (const app of existingApps) {
      const curStart = new Date(app.startDate).getTime();
      const curEnd = new Date(app.endDate).getTime();

      if (newStart <= curEnd && newEnd >= curStart) {
        throw new Error(
          `Overlapping leave application detected! You already have an application (${app.status}) from ${app.startDate} to ${app.endDate}.`
        );
      }
    }

    // 2. Check available leave balance
    const currentBalance = await this.getLeaveBalance(data.employeeId, data.leaveTypeId);
    const available = currentBalance ? currentBalance.balance : 0;
    if (available < data.numberOfDays) {
      throw new Error(
        `Insufficient leave credits! Available balance: ${available.toFixed(3)} days, requested: ${data.numberOfDays} days.`
      );
    }

    const id = generateId('app');
    const now = new Date().toISOString();
    const newApp: LeaveApplication = {
      ...data,
      id,
      status: 'Pending',
      createdAt: now,
      updatedAt: now,
    };

    this.leaveApplications.set(id, newApp);
    syncToFirestore('leaveApplications', id, newApp);

    return {
      ...newApp,
      employee: this.employees.get(data.employeeId),
      leaveType: this.leaveTypes.get(data.leaveTypeId),
    };
  }

  async updateLeaveApplicationStatus(
    id: string, 
    status: LeaveApplicationStatus, 
    approverId?: string, 
    approvalRemarks?: string
  ): Promise<LeaveApplication> {
    const app = this.leaveApplications.get(id);
    if (!app) {
      throw new Error('Leave application not found.');
    }

    if (app.status !== 'Pending' && status !== 'Cancelled') {
      throw new Error(`Application has already been processed with status: ${app.status}`);
    }

    const now = new Date().toISOString();

    if (status === 'Approved') {
      // Execute Leave Transaction (Debit) & Update Balance atomically
      await this.executeLeaveTransaction({
        employeeId: app.employeeId,
        leaveTypeId: app.leaveTypeId,
        transactionType: 'Debit',
        source: 'Leave Application',
        amount: app.numberOfDays,
        referenceId: app.id,
        remarks: `Approved leave application from ${app.startDate} to ${app.endDate}. Remarks: ${approvalRemarks || 'None'}`,
        createdBy: approverId || 'HR Admin',
      });
    }

    const updated: LeaveApplication = {
      ...app,
      status,
      approverId: approverId || app.approverId,
      approvalRemarks: approvalRemarks || app.approvalRemarks,
      approvedAt: status === 'Approved' ? now : app.approvedAt,
      updatedAt: now,
    };

    this.leaveApplications.set(id, updated);
    syncToFirestore('leaveApplications', id, updated);

    return {
      ...updated,
      employee: this.employees.get(app.employeeId),
      leaveType: this.leaveTypes.get(app.leaveTypeId),
      approver: updated.approverId ? this.employees.get(updated.approverId) : undefined,
    };
  }

  // --- COMPENSATORY TIME OFF (CTO) ---
  async getCTORequests(filter?: { employeeId?: string; status?: string }): Promise<CTORequest[]> {
    let list = Array.from(this.ctoRequests.values());

    if (filter?.employeeId) {
      list = list.filter(c => c.employeeId === filter.employeeId);
    }
    if (filter?.status) {
      list = list.filter(c => c.status === filter.status);
    }

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return list.map(c => ({
      ...c,
      employee: this.employees.get(c.employeeId),
      approver: c.approverId ? this.employees.get(c.approverId) : undefined,
    }));
  }

  async getCTORequestById(id: string): Promise<CTORequest | null> {
    const cto = this.ctoRequests.get(id);
    if (!cto) return null;
    return {
      ...cto,
      employee: this.employees.get(cto.employeeId),
      approver: cto.approverId ? this.employees.get(cto.approverId) : undefined,
    };
  }

  async createCTORequest(data: Omit<CTORequest, 'id' | 'equivalentLeave' | 'status' | 'createdAt'>): Promise<CTORequest> {
    const id = generateId('cto');
    const now = new Date().toISOString();
    
    // Convert hours to leave credit days using configurable rate (default: 8 hours = 1.0 day credit)
    const equivalentLeave = Number((data.hoursWorked * CTO_CONVERSION_SETTINGS.CREDITS_PER_HOUR).toFixed(3));

    const newCTO: CTORequest = {
      ...data,
      id,
      equivalentLeave,
      status: 'Pending',
      createdAt: now,
    };

    this.ctoRequests.set(id, newCTO);
    syncToFirestore('ctoRequests', id, newCTO);

    return {
      ...newCTO,
      employee: this.employees.get(data.employeeId),
    };
  }

  async updateCTORequestStatus(
    id: string, 
    status: CTOStatus, 
    approverId?: string, 
    approvalRemarks?: string
  ): Promise<CTORequest> {
    const cto = this.ctoRequests.get(id);
    if (!cto) {
      throw new Error('CTO Request not found.');
    }

    if (cto.status !== 'Pending') {
      throw new Error(`CTO Request has already been processed with status: ${cto.status}`);
    }

    const now = new Date().toISOString();

    if (status === 'Approved') {
      // Find or get CTO leave type ID (COMP)
      const ctoLeaveType = Array.from(this.leaveTypes.values()).find(lt => lt.code === 'COMP') || 
        Array.from(this.leaveTypes.values())[0];

      // Execute Leave Transaction (Credit) & Update Balance
      await this.executeLeaveTransaction({
        employeeId: cto.employeeId,
        leaveTypeId: ctoLeaveType.id,
        transactionType: 'Credit',
        source: 'CTO',
        amount: cto.equivalentLeave,
        referenceId: cto.id,
        remarks: `Approved ${cto.hoursWorked} hrs CTO worked on ${cto.dateWorked} (${cto.equivalentLeave} credit days).`,
        createdBy: approverId || 'HR Admin',
      });
    }

    const updated: CTORequest = {
      ...cto,
      status,
      approverId: approverId || cto.approverId,
      approvalRemarks: approvalRemarks || cto.approvalRemarks,
      approvedAt: status === 'Approved' ? now : cto.approvedAt,
    };

    this.ctoRequests.set(id, updated);
    syncToFirestore('ctoRequests', id, updated);

    return {
      ...updated,
      employee: this.employees.get(cto.employeeId),
      approver: updated.approverId ? this.employees.get(updated.approverId) : undefined,
    };
  }

  // --- MANUAL LEAVE ADJUSTMENTS ---
  async getLeaveAdjustments(filter?: { employeeId?: string }): Promise<LeaveAdjustment[]> {
    let list = Array.from(this.leaveAdjustments.values());

    if (filter?.employeeId) {
      list = list.filter(a => a.employeeId === filter.employeeId);
    }

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return list.map(adj => ({
      ...adj,
      employee: this.employees.get(adj.employeeId),
      leaveType: this.leaveTypes.get(adj.leaveTypeId),
    }));
  }

  async createLeaveAdjustment(data: Omit<LeaveAdjustment, 'id' | 'createdAt'>): Promise<LeaveAdjustment> {
    const id = generateId('adj');
    const now = new Date().toISOString();

    // Execute Leave Transaction & Update Balance
    const txType: TransactionType = data.adjustmentType === 'Credit' ? 'Credit' : 'Debit';
    
    await this.executeLeaveTransaction({
      employeeId: data.employeeId,
      leaveTypeId: data.leaveTypeId,
      transactionType: txType,
      source: 'Manual Adjustment',
      amount: data.amount,
      referenceId: id,
      remarks: `Manual ${data.adjustmentType} adjustment: ${data.reason}`,
      createdBy: data.createdBy,
    });

    const newAdj: LeaveAdjustment = {
      ...data,
      id,
      createdAt: now,
    };

    this.leaveAdjustments.set(id, newAdj);
    syncToFirestore('leaveAdjustments', id, newAdj);

    return {
      ...newAdj,
      employee: this.employees.get(data.employeeId),
      leaveType: this.leaveTypes.get(data.leaveTypeId),
    };
  }

  // --- AUDIT LOGS ---
  async getAuditLogs(filter?: { userId?: string; module?: string }): Promise<AuditLog[]> {
    let list = Array.from(this.auditLogs.values());

    if (filter?.userId) {
      list = list.filter(l => l.userId === filter.userId);
    }
    if (filter?.module) {
      list = list.filter(l => l.module === filter.module);
    }

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return list.map(log => ({
      ...log,
      user: this.users.get(log.userId),
    }));
  }

  async createAuditLog(data: Omit<AuditLog, 'id' | 'createdAt'>): Promise<AuditLog> {
    const id = generateId('audit');
    const now = new Date().toISOString();

    const newLog: AuditLog = {
      ...data,
      id,
      createdAt: now,
    };

    this.auditLogs.set(id, newLog);
    syncToFirestore('auditLogs', id, newLog);

    return {
      ...newLog,
      user: this.users.get(data.userId),
    };
  }

  // --- SYSTEM SETTINGS ---
  async getSystemSettings(): Promise<SystemSettings> {
    return { ...this.systemSettings };
  }

  async updateSystemSettings(data: Partial<SystemSettings>): Promise<SystemSettings> {
    this.systemSettings = {
      ...this.systemSettings,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    syncToFirestore('systemSettings', 'default', this.systemSettings);
    return { ...this.systemSettings };
  }

  // --- HOLIDAYS ---
  async getHolidays(): Promise<Holiday[]> {
    const list = Array.from(this.holidays.values());
    list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return list;
  }

  async getHolidayById(id: string): Promise<Holiday | null> {
    return this.holidays.get(id) || null;
  }

  async createHoliday(data: Omit<Holiday, 'id' | 'createdAt'>): Promise<Holiday> {
    const id = generateId('hol');
    const now = new Date().toISOString();
    const newHoliday: Holiday = {
      ...data,
      id,
      createdAt: now,
    };
    this.holidays.set(id, newHoliday);
    syncToFirestore('holidays', id, newHoliday);
    return newHoliday;
  }

  async updateHoliday(id: string, data: Partial<Holiday>): Promise<Holiday | null> {
    const existing = this.holidays.get(id);
    if (!existing) return null;
    const updated: Holiday = {
      ...existing,
      ...data,
    };
    this.holidays.set(id, updated);
    syncToFirestore('holidays', id, updated);
    return updated;
  }

  async deleteHoliday(id: string): Promise<boolean> {
    const deleted = this.holidays.delete(id);
    if (deleted) {
      removeFromFirestore('holidays', id);
    }
    return deleted;
  }

  // --- NOTIFICATIONS ---
  async getNotifications(userId?: string): Promise<Notification[]> {
    let list = Array.from(this.notifications.values());
    if (userId) {
      list = list.filter(n => n.userId === userId || n.userId === 'user_emp' || n.userId === 'user_hr' || n.userId === 'user_admin');
    }
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  }

  async createNotification(data: Omit<Notification, 'id' | 'createdAt' | 'isRead'>): Promise<Notification> {
    const id = generateId('notif');
    const now = new Date().toISOString();
    const newNotif: Notification = {
      ...data,
      id,
      isRead: false,
      createdAt: now,
    };
    this.notifications.set(id, newNotif);
    syncToFirestore('notifications', id, newNotif);
    return newNotif;
  }

  async markNotificationAsRead(id: string): Promise<boolean> {
    const notif = this.notifications.get(id);
    if (!notif) return false;
    const updated = { ...notif, isRead: true };
    this.notifications.set(id, updated);
    syncToFirestore('notifications', id, updated);
    return true;
  }

  async markAllNotificationsAsRead(userId: string): Promise<boolean> {
    this.notifications.forEach((notif, id) => {
      if (notif.userId === userId || userId === 'all') {
        const updated = { ...notif, isRead: true };
        this.notifications.set(id, updated);
        syncToFirestore('notifications', id, updated);
      }
    });
    return true;
  }

  // --- MONTHLY ACCRUAL LOGS ---
  async getMonthlyAccrualLogs(filter?: { employeeId?: string; month?: number; year?: number }): Promise<MonthlyAccrualLog[]> {
    let list = Array.from(this.monthlyAccrualLogs.values());
    if (filter?.employeeId) {
      list = list.filter(m => m.employeeId === filter.employeeId);
    }
    if (filter?.month) {
      list = list.filter(m => m.month === filter.month);
    }
    if (filter?.year) {
      list = list.filter(m => m.year === filter.year);
    }
    list.sort((a, b) => new Date(b.processedAt).getTime() - new Date(a.processedAt).getTime());
    return list.map(m => ({
      ...m,
      employee: this.employees.get(m.employeeId),
    }));
  }

  async createMonthlyAccrualLog(data: Omit<MonthlyAccrualLog, 'id' | 'processedAt'>): Promise<MonthlyAccrualLog> {
    const id = `accrual_${data.year}_${data.month}_${data.employeeId}`;
    const now = new Date().toISOString();
    const newLog: MonthlyAccrualLog = {
      ...data,
      id,
      processedAt: now,
    };
    this.monthlyAccrualLogs.set(id, newLog);
    this.saveToDisk();
    syncToFirestore('monthlyAccrualLogs', id, newLog);
    return {
      ...newLog,
      employee: this.employees.get(data.employeeId),
    };
  }

  // --- GENERATED REPORTS ---
  async getGeneratedReports(): Promise<GeneratedReport[]> {
    const list = Array.from(this.generatedReports.values());
    list.sort((a, b) => new Date(b.dateGenerated).getTime() - new Date(a.dateGenerated).getTime());
    return list;
  }

  async createGeneratedReport(data: Omit<GeneratedReport, 'id' | 'dateGenerated'>): Promise<GeneratedReport> {
    const id = generateId('report');
    const now = new Date().toISOString();
    const report: GeneratedReport = {
      ...data,
      id,
      dateGenerated: now,
    };
    this.generatedReports.set(id, report);
    syncToFirestore('generatedReports', id, report);
    return report;
  }

  // --- DOCUMENTS ---
  async getDocuments(filter?: { employeeId?: string; category?: string }): Promise<DocumentRecord[]> {
    let list = Array.from(this.documents.values()).filter(d => !d.isDeleted);
    if (filter?.employeeId) {
      list = list.filter(d => d.employeeId === filter.employeeId);
    }
    if (filter?.category) {
      list = list.filter(d => d.category === filter.category);
    }
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list.map(d => ({
      ...d,
      employee: d.employeeId ? this.employees.get(d.employeeId) : undefined,
    }));
  }

  async createDocument(data: Omit<DocumentRecord, 'id' | 'createdAt' | 'isDeleted'>): Promise<DocumentRecord> {
    const id = generateId('doc');
    const now = new Date().toISOString();
    const doc: DocumentRecord = {
      ...data,
      id,
      isDeleted: false,
      createdAt: now,
    };
    this.documents.set(id, doc);
    syncToFirestore('documents', id, doc);
    return doc;
  }

  async softDeleteDocument(id: string): Promise<boolean> {
    const doc = this.documents.get(id);
    if (!doc) return false;
    const updated = { ...doc, isDeleted: true };
    this.documents.set(id, updated);
    syncToFirestore('documents', id, updated);
    return true;
  }

  // --- BALANCE RECONCILIATION & INTEGRITY GUARD ---
  async reconcileLeaveBalances(employeeId?: string): Promise<{ reconciledCount: number; discrepancies: string[] }> {
    const transactions = Array.from(this.leaveTransactions.values());
    const balances = Array.from(this.leaveBalances.values());
    const targetBalances = employeeId ? balances.filter(b => b.employeeId === employeeId) : balances;

    let reconciledCount = 0;
    const discrepancies: string[] = [];

    for (const bal of targetBalances) {
      const empTxs = transactions.filter(t => t.employeeId === bal.employeeId && t.leaveTypeId === bal.leaveTypeId);
      empTxs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      let calculatedBalance = 0;
      empTxs.forEach(t => {
        if (t.transactionType === 'Credit') {
          calculatedBalance += t.amount;
        } else if (t.transactionType === 'Debit') {
          calculatedBalance -= t.amount;
        } else if (t.transactionType === 'Adjustment') {
          calculatedBalance += t.amount;
        }
      });

      if (Math.abs(bal.balance - calculatedBalance) > 0.0001 && empTxs.length > 0) {
        discrepancies.push(`Discrepancy for Employee ${bal.employeeId} (${bal.leaveTypeId}): Record=${bal.balance}, Ledger Sum=${calculatedBalance}`);
        // Reconcile
        bal.balance = calculatedBalance;
        bal.lastUpdated = new Date().toISOString();
        this.leaveBalances.set(bal.id, bal);
        syncToFirestore('leaveBalances', bal.id, bal);
      }
      reconciledCount++;
    }

    return { reconciledCount, discrepancies };
  }



}

// Global Singleton Instance to preserve in-memory store state across HMR / API route reloads
const globalForDb = globalThis as unknown as { dbStore: InMemoryDatabase };
export const dbStore = globalForDb.dbStore || new InMemoryDatabase();
if (process.env.NODE_ENV !== 'production') globalForDb.dbStore = dbStore;
