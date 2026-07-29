'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { roleSchema } from '@/lib/validations/schemas';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/skeleton';
import { SYSTEM_PERMISSIONS } from '@/lib/constants';
import { Role, PermissionKey } from '@/types';
import { Shield, Plus, Edit, Trash2, Check, ShieldAlert, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

type RoleFormValues = z.infer<typeof roleSchema>;

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<PermissionKey[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      roleName: '',
      description: '',
      permissions: [],
    },
  });

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/roles');
      const data = await res.json();
      if (data.success) setRoles(data.data);
    } catch {
      toast.error('Failed to load system roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleOpenCreate = () => {
    setEditingRole(null);
    setSelectedPermissions([
      'dashboard.employee_view',
      'profile.view_own',
    ]);
    reset({
      roleName: '',
      description: '',
      permissions: ['dashboard.employee_view', 'profile.view_own'],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (role: Role) => {
    setEditingRole(role);
    setSelectedPermissions(role.permissions);
    reset({
      roleName: role.roleName,
      description: role.description,
      permissions: role.permissions,
    });
    setIsModalOpen(true);
  };

  const togglePermission = (key: PermissionKey) => {
    let updated: PermissionKey[];
    if (selectedPermissions.includes(key)) {
      updated = selectedPermissions.filter((k) => k !== key);
    } else {
      updated = [...selectedPermissions, key];
    }
    setSelectedPermissions(updated);
    setValue('permissions', updated, { shouldValidate: true });
  };

  const onSubmit = async (values: RoleFormValues) => {
    setSubmitting(true);
    try {
      const url = editingRole ? `/api/roles/${editingRole.id}` : '/api/roles';
      const method = editingRole ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          permissions: selectedPermissions,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Operation failed');

      toast.success(editingRole ? 'Role permissions updated.' : 'Custom role created successfully.');
      setIsModalOpen(false);
      fetchRoles();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save role');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRole = async (role: Role) => {
    if (role.isSystemRole) {
      toast.error('System roles (Super Admin, HR Admin, Employee) are protected.');
      return;
    }
    if (!confirm(`Are you sure you want to delete custom role "${role.roleName}"?`)) return;

    try {
      const res = await fetch(`/api/roles/${role.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(`Role "${role.roleName}" deleted.`);
        fetchRoles();
      }
    } catch {
      toast.error('Failed to delete role');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            Roles & Permission Control
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Define system authorization roles, configure granular access capabilities, and secure agency endpoints.
          </p>
        </div>

        <Button onClick={handleOpenCreate} variant="primary" size="md" className="bg-purple-700 hover:bg-purple-800">
          <Plus className="w-4 h-4 mr-1" />
          Create Custom Role
        </Button>
      </div>

      {/* Role Cards Grid */}
      {loading ? (
        <TableSkeleton rows={3} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {roles.map((role) => (
            <Card
              key={role.id}
              className="flex flex-col justify-between border-slate-200 dark:border-slate-800 hover:shadow-md transition-all"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant={role.isSystemRole ? 'gold' : 'navy'}>
                    {role.isSystemRole ? 'System Core Role' : 'Custom Role'}
                  </Badge>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {role.permissions.length} Permissions
                  </span>
                </div>
                <CardTitle className="mt-2 text-base font-bold flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-600" />
                  {role.roleName}
                </CardTitle>
                <CardDescription className="line-clamp-2 text-xs">
                  {role.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-0 flex-1">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Key Capabilities:
                </div>
                <div className="flex flex-wrap gap-1">
                  {role.permissions.slice(0, 5).map((p) => (
                    <span
                      key={p}
                      className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono"
                    >
                      {p}
                    </span>
                  ))}
                  {role.permissions.length > 5 && (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold">
                      +{role.permissions.length - 5} more
                    </span>
                  )}
                </div>
              </CardContent>

              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end space-x-2 rounded-b-xl">
                <Button size="sm" variant="outline" onClick={() => handleOpenEdit(role)}>
                  <Edit className="w-3.5 h-3.5 mr-1" /> Edit Matrix
                </Button>
                {!role.isSystemRole && (
                  <Button size="sm" variant="danger" onClick={() => handleDeleteRole(role)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Role Modal with Interactive Permission Matrix */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRole ? `Permission Matrix - ${editingRole.roleName}` : 'Create Custom Role'}
        description="Toggle granular feature capabilities for this role."
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input label="Role Title" error={errors.roleName?.message} {...register('roleName')} />
          <Input label="Role Description" error={errors.description?.message} {...register('description')} />

          {/* Granular Permission Matrix Grouped by Category */}
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-600" />
              Granular Permission Matrix
            </h4>

            {errors.permissions && (
              <p className="text-xs text-red-500 font-bold">{errors.permissions.message}</p>
            )}

            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
              {SYSTEM_PERMISSIONS.map((group) => (
                <div
                  key={group.category}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
                >
                  <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">
                    {group.category}
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {group.permissions.map((perm) => {
                      const isChecked = selectedPermissions.includes(perm.key);
                      return (
                        <label
                          key={perm.key}
                          onClick={() => togglePermission(perm.key)}
                          className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-purple-50 dark:bg-purple-950/50 border-purple-300 dark:border-purple-800 text-purple-900 dark:text-purple-200 font-semibold'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border transition-colors ${
                              isChecked
                                ? 'bg-purple-600 border-purple-600 text-white'
                                : 'border-slate-300 dark:border-slate-700'
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <div>
                            <p className="font-bold leading-tight">{perm.label}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {perm.description}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting} className="bg-purple-700 hover:bg-purple-800">
              Save Role Matrix
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
