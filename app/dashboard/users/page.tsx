'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { userSchema } from '@/lib/validations/schemas';
import { z } from 'zod';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/skeleton';
import { User, Employee, Role } from '@/types';
import {
  UserCheck,
  Plus,
  Search,
  UserX,
  KeyRound,
  Shield,
  Edit,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

type UserFormValues = z.infer<typeof userSchema>;

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  
  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      employeeId: '',
      username: '',
      email: '',
      roleId: '',
      isActive: true,
    },
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [uRes, eRes, rRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/employees'),
        fetch('/api/roles'),
      ]);
      const [uData, eData, rData] = await Promise.all([
        uRes.json(),
        eRes.json(),
        rRes.json(),
      ]);
      if (uData.success) setUsers(uData.data);
      if (eData.success) setEmployees(eData.data);
      if (rData.success) setRoles(rData.data);
    } catch {
      toast.error('Failed to load user management data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setEditingUser(null);
    const defaultEmp = employees[0];
    const defaultRole = roles[0];
    reset({
      employeeId: defaultEmp?.id || '',
      username: defaultEmp ? defaultEmp.email.split('@')[0] : '',
      email: defaultEmp?.email || '',
      roleId: defaultRole?.id || '',
      isActive: true,
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (userItem: User) => {
    setEditingUser(userItem);
    reset({
      employeeId: userItem.employeeId,
      username: userItem.username,
      email: userItem.email,
      roleId: userItem.roleId,
      isActive: userItem.isActive,
    });
    setIsCreateModalOpen(true);
  };

  const onSubmit = async (values: UserFormValues) => {
    setSubmitting(true);
    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Operation failed');

      toast.success(editingUser ? 'User updated successfully.' : 'New user account created.');
      setIsCreateModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (userItem: User) => {
    const nextState = !userItem.isActive;
    try {
      const res = await fetch(`/api/users/${userItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextState }),
      });
      if (res.ok) {
        toast.success(`User account ${nextState ? 'activated' : 'deactivated'}.`);
        fetchData();
      }
    } catch {
      toast.error('Failed to update user status');
    }
  };

  const handleResetPassword = async (userItem: User) => {
    try {
      const res = await fetch(`/api/users/${userItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_password' }),
      });
      if (res.ok) {
        toast.success(`Password reset verification email dispatched to ${userItem.email}.`);
      }
    } catch {
      toast.error('Password reset request failed');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.employee && `${u.employee.firstName} ${u.employee.lastName}`.toLowerCase().includes(search.toLowerCase()));

    const matchesRole = !roleFilter || u.roleId === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-[#1B4D3E] dark:text-emerald-400" />
            User Account Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Provision accounts for PhilFIDA employees, assign administrative security roles, and reset credentials.
          </p>
        </div>

        <Button onClick={handleOpenCreate} variant="secondary" size="md" className="shadow-md">
          <Plus className="w-4 h-4 mr-1" />
          Create User Account
        </Button>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by username, email, or employee name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]"
            />
          </div>

          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs"
          >
            <option value="">All Security Roles</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.roleName}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {/* Users Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <TableSkeleton rows={4} />
        ) : filteredUsers.length === 0 ? (
          <EmptyState
            icon={UserCheck}
            title="No Users Found"
            description="No system user accounts match your search parameters."
            actionLabel="Reset Search"
            onAction={() => {
              setSearch('');
              setRoleFilter('');
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 uppercase font-bold tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3">Linked Employee</th>
                  <th className="px-4 py-3">Username & Email</th>
                  <th className="px-4 py-3">Assigned Role</th>
                  <th className="px-4 py-3">Account Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3">
                      {u.employee ? (
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {u.employee.firstName} {u.employee.lastName}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {u.employee.employeeNumber} &bull; {u.employee.division}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unlinked Account</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono font-bold text-slate-800 dark:text-slate-200">{u.username}</div>
                      <div className="text-[11px] text-slate-500">{u.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          u.role?.roleName === 'Super Admin'
                            ? 'gold'
                            : u.role?.roleName === 'HR Administrator'
                            ? 'navy'
                            : 'neutral'
                        }
                      >
                        <Shield className="w-3 h-3 mr-1" />
                        {u.role?.roleName || 'Employee'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={u.isActive ? 'success' : 'danger'}>
                        {u.isActive ? 'Active' : 'Deactivated'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleResetPassword(u)}
                        title="Reset Password"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenEdit(u)}
                        title="Edit User Role"
                      >
                        <Edit className="w-3.5 h-3.5 text-blue-600" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleActive(u)}
                        title={u.isActive ? 'Deactivate Account' : 'Activate Account'}
                      >
                        {u.isActive ? (
                          <UserX className="w-3.5 h-3.5 text-red-500" />
                        ) : (
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create / Edit User Modal */}
      <Dialog
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={editingUser ? 'Edit User Account' : 'Create System User Account'}
        description="Link a PhilFIDA employee to system credentials and grant security roles."
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Select label="Linked Employee" error={errors.employeeId?.message} {...register('employeeId')}>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.employeeNumber} - {e.firstName} {e.lastName} ({e.office.split('(')[0]})
              </option>
            ))}
          </Select>

          <Input label="Username" error={errors.username?.message} {...register('username')} />

          <Input label="System Email Address" type="email" error={errors.email?.message} {...register('email')} />

          <Select label="Assign Role" error={errors.roleId?.message} {...register('roleId')}>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.roleName} - {r.description}
              </option>
            ))}
          </Select>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="secondary" isLoading={submitting}>
              {editingUser ? 'Save User Settings' : 'Create User Account'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
