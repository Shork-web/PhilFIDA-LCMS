/**
 * Direct Firebase Auth & Cloud Firestore Integration Helper
 * 
 * Handles direct client-side Firestore user retrieval and creation.
 * Bypasses intermediate API proxies to eliminate Vercel serverless cold-start 500 errors.
 */
import { User as FirebaseUser } from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { User, Employee, LeaveBalance, AuthUser } from '@/types';
import { generateId } from '@/lib/utils';
import { INITIAL_LEAVE_TYPES, SUPER_ADMIN_PERMISSIONS, EMPLOYEE_PERMISSIONS } from '@/lib/constants';

export interface RegistrationExtraDetails {
  displayName?: string;
  position?: string;
  division?: string;
  office?: string;
  appointmentType?: string;
  authProvider?: 'email' | 'google';
}

function buildAuthUserPayload(user: User, employee?: Employee | null): AuthUser {
  const isSuperAdmin = user.roleId === 'role_superadmin' || user.email.toLowerCase() === 'iversonwork039@gmail.com';
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    roleId: user.roleId || (isSuperAdmin ? 'role_superadmin' : 'role_employee'),
    roleName: isSuperAdmin ? 'IT/MIS (Super Admin)' : 'Staff (Employee)',
    permissions: isSuperAdmin ? (SUPER_ADMIN_PERMISSIONS as any) : (EMPLOYEE_PERMISSIONS as any),
    accountStatus: user.accountStatus,
    employeeId: employee?.id || user.employeeId,
    employeeName: employee ? `${employee.firstName} ${employee.lastName}` : (user.displayName || user.username),
    employeeNumber: employee?.employeeNumber,
    office: employee?.office,
    division: employee?.division,
    position: employee?.position,
    photoUrl: user.photoUrl,
  };
}

function sanitizeForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

export async function syncDirectFirebaseUser(
  fbUser: FirebaseUser,
  extraDetails?: RegistrationExtraDetails
): Promise<{ authUser: AuthUser; user: User; pending: boolean }> {
  const email = (fbUser.email || '').trim().toLowerCase();
  const userId = fbUser.uid;

  if (!email) {
    throw new Error('No valid email address associated with Firebase Auth account.');
  }

  const isSuperAdmin = email === 'iversonwork039@gmail.com';

  // 1. Try reading User Document directly by Firebase UID or email
  let existingUserDoc: any = null;
  let existingEmpDoc: any = null;

  if (db) {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        existingUserDoc = { id: userSnap.id, ...userSnap.data() };
      } else {
        const q = query(collection(db, 'users'), where('email', '==', email));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          existingUserDoc = { id: qSnap.docs[0].id, ...qSnap.docs[0].data() };
        }
      }

      if (existingUserDoc?.employeeId) {
        const empRef = doc(db, 'employees', existingUserDoc.employeeId);
        const empSnap = await getDoc(empRef);
        if (empSnap.exists()) {
          existingEmpDoc = { id: empSnap.id, ...empSnap.data() };
        }
      }
    } catch (err) {
      console.warn('[Direct Firestore Auth] Document fetch notice:', err);
    }
  }

  // 2. If User document already exists in Firestore, return it immediately!
  if (existingUserDoc) {
    const userPayload: User = {
      id: existingUserDoc.id || userId,
      email: existingUserDoc.email || email,
      username: existingUserDoc.username || email.split('@')[0],
      roleId: existingUserDoc.roleId || (isSuperAdmin ? 'role_superadmin' : 'role_employee'),
      isActive: existingUserDoc.isActive ?? true,
      accountStatus: existingUserDoc.accountStatus || (isSuperAdmin ? 'Active' : 'Pending'),
      authProvider: existingUserDoc.authProvider || extraDetails?.authProvider || 'email',
      authProviders: existingUserDoc.authProviders || [extraDetails?.authProvider || 'email'],
      emailVerified: fbUser.emailVerified || existingUserDoc.emailVerified || false,
      employeeId: existingUserDoc.employeeId,
      displayName: existingUserDoc.displayName || fbUser.displayName || email.split('@')[0],
      photoUrl: fbUser.photoURL || existingUserDoc.photoUrl,
      createdAt: existingUserDoc.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const authUser = buildAuthUserPayload(userPayload, existingEmpDoc);

    return {
      authUser,
      user: userPayload,
      pending: userPayload.accountStatus === 'Pending',
    };
  }

  // 3. User does NOT exist in Firestore — Create Employee & User records directly in Cloud Firestore
  const empId = generateId('emp');
  const now = new Date().toISOString();
  const appointmentType = extraDetails?.appointmentType || 'Permanent';
  const nameParts = (extraDetails?.displayName || fbUser.displayName || email.split('@')[0]).trim().split(' ');
  const firstName = nameParts[0] || 'Employee';
  const lastName = nameParts.slice(1).join(' ') || 'Staff';

  const newEmployee: Employee = {
    id: empId,
    employeeNumber: `EMP-${Math.floor(100000 + Math.random() * 900000)}`,
    firstName,
    lastName,
    email,
    contactNumber: 'N/A',
    position: extraDetails?.position || 'Employee - Staff',
    office: extraDetails?.office || 'PhilFIDA Regional Office VII - Cebu HQ',
    division: extraDetails?.division || 'AFMD - Admin Finance and Management Division',
    appointmentType,
    employmentStatus: 'Active',
    appointmentDate: now.split('T')[0],
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  const newUser: User = {
    id: userId,
    employeeId: isSuperAdmin ? undefined : empId,
    username: email.split('@')[0],
    email,
    roleId: isSuperAdmin ? 'role_superadmin' : 'role_employee',
    isActive: isSuperAdmin ? true : false,
    accountStatus: isSuperAdmin ? 'Active' : 'Pending',
    authProvider: extraDetails?.authProvider || 'email',
    authProviders: [extraDetails?.authProvider || 'email'],
    emailVerified: fbUser.emailVerified || false,
    displayName: extraDetails?.displayName || fbUser.displayName || email.split('@')[0],
    photoUrl: fbUser.photoURL || undefined,
    createdAt: now,
    updatedAt: now,
  };

  if (db) {
    try {
      // Save User Doc (sanitized)
      await setDoc(doc(db, 'users', userId), sanitizeForFirestore(newUser));

      // Save Employee Doc (if not Super Admin)
      if (!isSuperAdmin) {
        await setDoc(doc(db, 'employees', empId), sanitizeForFirestore(newEmployee));

        // Seed initial leave balances
        const isCOSorJO = appointmentType === 'COS / JO' || appointmentType === 'COS/JO' || appointmentType === 'Job Order';
        for (const lt of INITIAL_LEAVE_TYPES) {
          const balanceId = `lb_${empId}_lt_${lt.code.toLowerCase()}`;
          const isWellness = lt.code.toUpperCase() === 'WELLNESS' || lt.leaveName.toLowerCase().includes('wellness');
          const initialBalance = isCOSorJO ? (isWellness ? 5 : 0) : 0;

          const lbRecord: LeaveBalance = {
            id: balanceId,
            employeeId: empId,
            leaveTypeId: `lt_${lt.code.toLowerCase()}`,
            balance: initialBalance,
            lastUpdated: now,
          };
          await setDoc(doc(db, 'leaveBalances', balanceId), sanitizeForFirestore(lbRecord));
        }
      }
    } catch (e) {
      console.warn('[Direct Firestore Auth] Direct write warning:', e);
    }
  }

  const authUser = buildAuthUserPayload(newUser, isSuperAdmin ? null : newEmployee);

  return {
    authUser,
    user: newUser,
    pending: newUser.accountStatus === 'Pending',
  };
}
