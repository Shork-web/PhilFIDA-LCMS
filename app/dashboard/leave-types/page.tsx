'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { leaveTypeSchema } from '@/lib/validations/schemas';
import { z } from 'zod';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/skeleton';
import { LeaveType } from '@/types';
import { CalendarDays, Plus, Search, Edit, Power, Sparkles, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

type LeaveTypeFormValues = z.infer<typeof leaveTypeSchema>;

export default function LeaveTypesPage() {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLt, setEditingLt] = useState<LeaveType | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeaveTypeFormValues>({
    resolver: zodResolver(leaveTypeSchema),
    defaultValues: {
      code: '',
      leaveName: '',
      description: '',
      isActive: true,
      defaultCreditsPerYear: 15,
    },
  });

  const fetchLeaveTypes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/leave-types');
      const data = await res.json();
      if (data.success) setLeaveTypes(data.data);
    } catch {
      toast.error('Failed to load leave categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveTypes();
  }, []);

  const handleOpenCreate = () => {
    setEditingLt(null);
    reset({
      code: '',
      leaveName: '',
      description: '',
      isActive: true,
      defaultCreditsPerYear: 15,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (lt: LeaveType) => {
    setEditingLt(lt);
    reset({
      code: lt.code,
      leaveName: lt.leaveName,
      description: lt.description,
      isActive: lt.isActive,
      defaultCreditsPerYear: lt.defaultCreditsPerYear || 0,
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (values: LeaveTypeFormValues) => {
    setSubmitting(true);
    try {
      const url = editingLt ? `/api/leave-types/${editingLt.id}` : '/api/leave-types';
      const method = editingLt ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Operation failed');

      toast.success(
        editingLt
          ? 'Leave category updated successfully.'
          : 'New leave category created. Automatic balance documents will be generated for new employees.'
      );

      setIsModalOpen(false);
      fetchLeaveTypes();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save leave category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (lt: LeaveType) => {
    const nextState = !lt.isActive;
    try {
      const res = await fetch(`/api/leave-types/${lt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextState }),
      });
      if (res.ok) {
        toast.success(`Leave Category "${lt.code}" ${nextState ? 'enabled' : 'disabled'}.`);
        fetchLeaveTypes();
      }
    } catch {
      toast.error('Failed to update leave category status');
    }
  };

  const filtered = leaveTypes.filter(
    (lt) =>
      lt.code.toLowerCase().includes(search.toLowerCase()) ||
      lt.leaveName.toLowerCase().includes(search.toLowerCase()) ||
      lt.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-amber-500" />
            Leave Categories Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Civil Service Commission (CSC) leave categories and agency leave credit parameters.
          </p>
        </div>

        <Button onClick={handleOpenCreate} variant="accent" size="md" className="shadow-md">
          <Plus className="w-4 h-4 mr-1" />
          Add Leave Category
        </Button>
      </div>

      {/* Search Filter */}
      <Card className="p-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by code, leave title, or CSC policy description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </Card>

      {/* Leave Types Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <TableSkeleton rows={4} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No Leave Categories Found"
            description="No leave categories match your search parameter."
            actionLabel="Clear Search"
            onAction={() => setSearch('')}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 uppercase font-bold tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Leave Category Name</th>
                  <th className="px-4 py-3">CSC Description & Guidance</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((lt) => (
                  <tr key={lt.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-[#0F2C59] dark:text-amber-400 text-sm">
                      {lt.code}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                      {lt.leaveName}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 max-w-md">
                      <p className="line-clamp-2">{lt.description}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={lt.isActive ? 'success' : 'danger'}>
                        {lt.isActive ? 'Active' : 'Disabled'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => handleOpenEdit(lt)} title="Edit Category">
                        <Edit className="w-3.5 h-3.5 text-blue-600" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleActive(lt)}
                        title={lt.isActive ? 'Disable Category' : 'Enable Category'}
                      >
                        <Power
                          className={`w-3.5 h-3.5 ${
                            lt.isActive ? 'text-emerald-600' : 'text-slate-400 hover:text-emerald-600'
                          }`}
                        />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingLt ? `Edit Category - ${editingLt.code}` : 'Add New Leave Category'}
        description="Configure Civil Service leave category parameters."
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Leave Code (e.g. VL, SL, SPL)" error={errors.code?.message} {...register('code')} />
          <Input label="Leave Category Name" error={errors.leaveName?.message} {...register('leaveName')} />
          <Input
            label="CSC Policy & Rule Description"
            error={errors.description?.message}
            {...register('description')}
          />

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="accent" isLoading={submitting}>
              {editingLt ? 'Save Changes' : 'Create Category'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
