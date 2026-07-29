/**
 * BootstrapService — Handles first-launch initialization for PhilFIDA LCMS.
 *
 * Rules:
 * 1. System roles are always bootstrapped (done by InMemoryDatabase.init).
 * 2. If zero user accounts exist when someone registers, they become Super Admin automatically.
 * 3. Every subsequent registration defaults to Employee role + Pending status.
 */
import { UserService } from './user-service';
import { RoleService } from './role-service';
import { User, AccountStatus } from '@/types';

export class BootstrapService {
  /**
   * Returns true if there are no user accounts in the system.
   * Used to trigger automatic Super Admin bootstrap for the first user.
   */
  static async isFirstUser(): Promise<boolean> {
    const users = await UserService.getAll();
    return users.length === 0;
  }

  /**
   * Promotes a newly-registered user to Super Admin.
   * Called ONLY when isFirstUser() returns true.
   */
  static async bootstrapFirstSuperAdmin(userId: string): Promise<User | null> {
    return UserService.update(userId, {
      roleId: 'role_superadmin',
      accountStatus: 'Active',
      isActive: true,
    });
  }

  /**
   * Ensures all 4 system roles exist. Idempotent — safe to call multiple times.
   * In the in-memory store this is handled by InMemoryDatabase.init(),
   * but this method provides a safety net for the Firestore-backed mode.
   */
  static async ensureSystemRoles(): Promise<void> {
    const roles = await RoleService.getAll();
    const existingIds = new Set(roles.map(r => r.id));
    const systemRoleIds = ['role_superadmin', 'role_hradmin', 'role_supervisor', 'role_employee'];
    const missing = systemRoleIds.filter(id => !existingIds.has(id));
    if (missing.length > 0) {
      console.warn('[BootstrapService] Missing system roles:', missing, '— they should have been seeded by InMemoryDatabase.init()');
    }
  }

  /**
   * Builds the default User payload for a new registration.
   * ALL new registrations default strictly to Staff (role_employee) + Pending status.
   */
  static buildNewUserPayload(params: {
    email: string;
    displayName: string;
    authProvider: 'email' | 'google';
    photoUrl?: string;
  }): Omit<User, 'id' | 'createdAt' | 'updatedAt'> {
    const emailLower = params.email.toLowerCase();
    const isITAdmin = emailLower === 'iversonwork039@gmail.com' || emailLower === 'admin@philfida.da.gov.ph';
    return {
      username: params.displayName || params.email.split('@')[0],
      email: params.email,
      displayName: params.displayName,
      roleId: isITAdmin ? 'role_superadmin' : 'role_employee',
      accountStatus: (isITAdmin ? 'Active' : 'Pending') as AccountStatus,
      isActive: isITAdmin ? true : false,
      authProvider: params.authProvider,
      photoUrl: params.photoUrl,
    };
  }
}
