'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { employeeSchema } from '@/lib/validations/schemas';
import { z } from 'zod';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/skeleton';
import { formatDate, formatNumber } from '@/lib/utils';
import { PHILFIDA_OFFICES, PHILFIDA_DIVISIONS, APPOINTMENT_TYPES, EMPLOYMENT_STATUSES } from '@/lib/constants';
import { Employee, LeaveBalance } from '@/types';
import {
  Users,
  Plus,
  Search,
  Filter,
  UserCheck,
  UserX,
  Edit,
  Eye,
  Building2,
  Calendar,
  Award,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

type EmployeeFormValues = z.infer<typeof employeeSchema>;

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [officeFilter, setOfficeFilter] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [viewingBalances, setViewingBalances] = useState<LeaveBalance[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      employeeNumber: '',
      firstName: '',
      middleName: '',
      lastName: '',
      suffix: '',
      email: '',
      contactNumber: '',
      office: PHILFIDA_OFFICES[0],
      division: PHILFIDA_DIVISIONS[0],
      position: '',
      appointmentType: 'Permanent',
      employmentStatus: 'Active',
      appointmentDate: new Date().toISOString().split('T')[0],
      isActive: true,
    },
  });

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/employees');
      const data = await res.json();
      if (data.success) setEmployees(data.data);
    } catch {
      toast.error('Failed to load employee list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleOpenCreate = () => {
    setEditingEmployee(null);
    reset({
      employeeNumber: `PF-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      firstName: '',
      middleName: '',
      lastName: '',
      suffix: '',
      email: '',
      contactNumber: '+63 917 ',
      office: PHILFIDA_OFFICES[0],
      division: PHILFIDA_DIVISIONS[0],
      position: '',
      appointmentType: 'Permanent',
      employmentStatus: 'Active',
      appointmentDate: new Date().toISOString().split('T')[0],
      isActive: true,
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    reset({
      employeeNumber: emp.employeeNumber,
      firstName: emp.firstName,
      middleName: emp.middleName || '',
      lastName: emp.lastName,
      suffix: emp.suffix || '',
      email: emp.email,
      contactNumber: emp.contactNumber,
      office: emp.office,
      division: emp.division,
      position: emp.position,
      appointmentType: emp.appointmentType,
      employmentStatus: emp.employmentStatus,
      appointmentDate: emp.appointmentDate,
      isActive: emp.isActive,
    });
    setIsCreateModalOpen(true);
  };

  const handleViewDetails = async (emp: Employee) => {
    setViewingEmployee(emp);
    try {
      const res = await fetch(`/api/leave-balances?employeeId=${emp.id}`);
      const data = await res.json();
      if (data.success) setViewingBalances(data.data);
    } catch {
      toast.error('Failed to load leave balances for employee');
    }
  };

  const onSubmit = async (values: EmployeeFormValues) => {
    setSubmitting(true);
    try {
      const url = editingEmployee ? `/api/employees/${editingEmployee.id}` : '/api/employees';
      const method = editingEmployee ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Operation failed');

      toast.success(
        editingEmployee
          ? 'Employee profile updated successfully.'
          : 'New employee registered successfully with automatic 0-balance leave credits initialized for all active leave categories!'
      );

      setIsCreateModalOpen(false);
      fetchEmployees();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save employee record');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (emp: Employee) => {
    const nextState = !emp.isActive;
    try {
      const res = await fetch(`/api/employees/${emp.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextState }),
      });
      if (res.ok) {
        toast.success(`Employee ${emp.lastName} ${nextState ? 'activated' : 'deactivated'}.`);
        fetchEmployees();
      }
    } catch {
      toast.error('Failed to update status');
    }
  };

  // Filtering
  const filteredEmployees = employees.filter((e) => {
    const matchesSearch =
      e.firstName.toLowerCase().includes(search.toLowerCase()) ||
      e.lastName.toLowerCase().includes(search.toLowerCase()) ||
      e.employeeNumber.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase()) ||
      e.position.toLowerCase().includes(search.toLowerCase());

    const matchesOffice = !officeFilter || e.office === officeFilter;
    const matchesDivision = !divisionFilter || e.division === divisionFilter;
    const matchesStatus = !statusFilter || e.employmentStatus === statusFilter;

    return matchesSearch && matchesOffice && matchesDivision && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredEmployees.length / pageSize) || 1;
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-[#0F2C59] dark:text-blue-400" />
            PhilFIDA Employee Directory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage agency personnel records, appointments, offices, and automatic leave balance initializations.
          </p>
        </div>

        <Button onClick={handleOpenCreate} variant="primary" size="md" className="shadow-md">
          <Plus className="w-4 h-4 mr-1" />
          Add New Employee
        </Button>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, ID, or position..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F2C59]"
            />
          </div>

          <Select
            value={officeFilter}
            onChange={(e) => {
              setOfficeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs"
          >
            <option value="">All Offices (Central & Regional)</option>
            {PHILFIDA_OFFICES.map((off) => (
              <option key={off} value={off}>
                {off}
              </option>
            ))}
          </Select>

          <Select
            value={divisionFilter}
            onChange={(e) => {
              setDivisionFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs"
          >
            <option value="">All Divisions & Units</option>
            {PHILFIDA_DIVISIONS.map((div) => (
              <option key={div} value={div}>
                {div}
              </option>
            ))}
          </Select>

          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs"
          >
            <option value="">All Employment Statuses</option>
            {EMPLOYMENT_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {/* Employee Data Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <TableSkeleton rows={5} />
        ) : filteredEmployees.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No Employees Found"
            description="No personnel records matched your filter criteria."
            actionLabel="Reset Filters"
            onAction={() => {
              setSearch('');
              setOfficeFilter('');
              setDivisionFilter('');
              setStatusFilter('');
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 uppercase font-bold tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3">Employee #</th>
                  <th className="px-4 py-3">Full Name</th>
                  <th className="px-4 py-3">Office & Division</th>
                  <th className="px-4 py-3">Position</th>
                  <th className="px-4 py-3">Appointment</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-[#0F2C59] dark:text-amber-400">
                      {emp.employeeNumber}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {emp.lastName}, {emp.firstName} {emp.middleName ? `${emp.middleName[0]}.` : ''} {emp.suffix}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{emp.email}</div>
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate">
                      <div className="font-medium text-slate-800 dark:text-slate-200 truncate">{emp.division}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{emp.office}</div>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                      {emp.position}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="navy">{emp.appointmentType}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={emp.isActive ? 'success' : 'danger'}>
                        {emp.employmentStatus}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewDetails(emp)}
                        title="View Balances & Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenEdit(emp)}
                        title="Edit Employee"
                      >
                        <Edit className="w-3.5 h-3.5 text-blue-600" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleActive(emp)}
                        title={emp.isActive ? 'Deactivate Employee' : 'Activate Employee'}
                      >
                        {emp.isActive ? (
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

        {/* Pagination Footer */}
        {filteredEmployees.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {Math.min((currentPage - 1) * pageSize + 1, filteredEmployees.length)} to{' '}
              {Math.min(currentPage * pageSize, filteredEmployees.length)} of {filteredEmployees.length} employees
            </span>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </Button>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Create / Edit Employee Modal */}
      <Dialog
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={editingEmployee ? 'Edit Employee Record' : 'Register New Employee'}
        description={
          editingEmployee
            ? 'Update official personnel details.'
            : 'Register a new PhilFIDA employee. Active leave credit balances (0 default) will automatically be generated for all active leave categories upon submission.'
        }
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center gap-2 text-xs text-amber-900 dark:text-amber-200 font-medium mb-4">
            <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span>
              Automatic Leave Balance Initialization Enabled: New employee registrations trigger automatic creation of leave credit records.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Employee Number"
              error={errors.employeeNumber?.message}
              {...register('employeeNumber')}
            />
            <Input
              label="Email Address"
              type="email"
              error={errors.email?.message}
              {...register('email')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <Input label="First Name" error={errors.firstName?.message} {...register('firstName')} />
            <Input label="Middle Name" {...register('middleName')} />
            <Input label="Last Name" error={errors.lastName?.message} {...register('lastName')} />
            <Input label="Suffix" placeholder="e.g. Jr., III" {...register('suffix')} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Contact Number" error={errors.contactNumber?.message} {...register('contactNumber')} />
            <Input label="Position Title" error={errors.position?.message} {...register('position')} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Office Station" error={errors.office?.message} {...register('office')}>
              {PHILFIDA_OFFICES.map((off) => (
                <option key={off} value={off}>
                  {off}
                </option>
              ))}
            </Select>

            <Select label="Division / Unit" error={errors.division?.message} {...register('division')}>
              {PHILFIDA_DIVISIONS.map((div) => (
                <option key={div} value={div}>
                  {div}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select label="Appointment Type" error={errors.appointmentType?.message} {...register('appointmentType')}>
              {APPOINTMENT_TYPES.map((apt) => (
                <option key={apt} value={apt}>
                  {apt}
                </option>
              ))}
            </Select>

            <Select label="Employment Status" error={errors.employmentStatus?.message} {...register('employmentStatus')}>
              {EMPLOYMENT_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </Select>

            <Input
              label="Appointment Date"
              type="date"
              error={errors.appointmentDate?.message}
              {...register('appointmentDate')}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting}>
              {editingEmployee ? 'Save Changes' : 'Create & Initialize Balances'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* View Employee & Balances Details Modal */}
      {viewingEmployee && (
        <Dialog
          isOpen={Boolean(viewingEmployee)}
          onClose={() => setViewingEmployee(null)}
          title={`Employee Record - ${viewingEmployee.firstName} ${viewingEmployee.lastName}`}
          description={`Employee Number: ${viewingEmployee.employeeNumber}`}
          maxWidth="xl"
        >
          <div className="space-y-6">
            {/* Overview Card */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-400 font-medium">Position:</span>
                <p className="font-bold text-slate-900 dark:text-white">{viewingEmployee.position}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Division:</span>
                <p className="font-bold text-slate-900 dark:text-white">{viewingEmployee.division}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Office Station:</span>
                <p className="font-bold text-slate-900 dark:text-white">{viewingEmployee.office}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Appointment:</span>
                <p className="font-bold text-slate-900 dark:text-white">{viewingEmployee.appointmentType}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Appointment Date:</span>
                <p className="font-bold text-slate-900 dark:text-white">{formatDate(viewingEmployee.appointmentDate)}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Status:</span>
                <Badge variant={viewingEmployee.isActive ? 'success' : 'danger'}>
                  {viewingEmployee.employmentStatus}
                </Badge>
              </div>
            </div>

            {/* Balances List */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" />
                Active Leave Credit Balances
              </h4>

              {viewingBalances.length === 0 ? (
                <p className="text-xs text-slate-400">No leave balances found.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {viewingBalances.map((b) => (
                    <div
                      key={b.id}
                      className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
                    >
                      <span className="font-bold text-[#0F2C59] dark:text-amber-400">
                        {b.leaveType?.code || 'LEAVE'}
                      </span>
                      <p className="text-[11px] text-slate-500 truncate">{b.leaveType?.leaveName}</p>
                      <p className="text-lg font-black text-slate-900 dark:text-white mt-1">
                        {formatNumber(b.balance)} <span className="text-xs font-medium text-slate-400">days</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setViewingEmployee(null)}>
                Close
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
