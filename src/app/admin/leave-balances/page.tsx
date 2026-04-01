'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import { HiOutlineCalendarDays, HiOutlineCheckCircle, HiOutlinePencilSquare, HiOutlineXMark } from 'react-icons/hi2';
import toast from 'react-hot-toast';

interface EmployeeBalance {
    id: string;
    name: string;
    email: string;
    role: string;
    designation: string | null;
    leaveAdjustment: number;
    approvedLeaves: number;
    total: number;
    used: number;
    remaining: number;
}

export default function AdminLeaveBalancesPage() {
    const [employees, setEmployees] = useState<EmployeeBalance[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchBalances(); }, []);

    const fetchBalances = async () => {
        try {
            const res = await fetch('/api/admin/leave-balances');
            if (res.ok) {
                const data = await res.json();
                setEmployees(data.employees || []);
            }
        } catch { } finally { setLoading(false); }
    };

    const startEdit = (emp: EmployeeBalance) => {
        setEditingId(emp.id);
        setEditValue(String(emp.leaveAdjustment));
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditValue('');
    };

    const saveAdjustment = async (userId: string) => {
        const val = parseInt(editValue);
        if (isNaN(val) || val < 0) {
            toast.error('Please enter a valid non-negative number');
            return;
        }
        setSaving(true);
        try {
            const res = await fetch('/api/admin/leave-balances', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, leaveAdjustment: val }),
            });
            if (res.ok) {
                toast.success('Leave balance updated');
                setEditingId(null);
                fetchBalances();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to update');
            }
        } catch { toast.error('Failed to update'); } finally { setSaving(false); }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6 max-w-[1400px]">

                {/* Header */}
                <div className="glass-card p-5 sm:p-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                            <HiOutlineCalendarDays className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                Leave Balance Management
                            </h1>
                            <p className="text-slate-500 text-sm mt-0.5">
                                Set pre-consumed leaves for employees joining mid-year. Approved leave requests are counted automatically.
                            </p>
                        </div>
                    </div>
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                        <strong>How it works:</strong> "Prior Leaves" lets you set how many leaves an employee already consumed before joining this system. Total used = Prior Leaves + Approved leave requests this year.
                    </div>
                </div>

                {/* Table */}
                <div className="glass-card overflow-hidden">
                    <div className="p-5 border-b border-slate-100 bg-white/50">
                        <h2 className="text-base font-bold text-slate-900">All Employees — {new Date().getFullYear()} Leave Balances</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="text-xs font-bold text-slate-500 uppercase tracking-wider px-5 py-4">Employee</th>
                                    <th className="text-xs font-bold text-slate-500 uppercase tracking-wider px-5 py-4">Role</th>
                                    <th className="text-xs font-bold text-slate-500 uppercase tracking-wider px-5 py-4 text-center">Total Annual</th>
                                    <th className="text-xs font-bold text-slate-500 uppercase tracking-wider px-5 py-4 text-center">Prior Leaves</th>
                                    <th className="text-xs font-bold text-slate-500 uppercase tracking-wider px-5 py-4 text-center">Approved</th>
                                    <th className="text-xs font-bold text-slate-500 uppercase tracking-wider px-5 py-4 text-center">Total Used</th>
                                    <th className="text-xs font-bold text-slate-500 uppercase tracking-wider px-5 py-4 text-center">Remaining</th>
                                    <th className="text-xs font-bold text-slate-500 uppercase tracking-wider px-5 py-4">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/80">
                                {employees.map((emp) => (
                                    <tr key={emp.id} className="hover:bg-indigo-50/20 transition-colors group">
                                        <td className="px-5 py-4">
                                            <p className="font-bold text-sm text-slate-900">{emp.name}</p>
                                            <p className="text-xs text-slate-400">{emp.email}</p>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
                                                {emp.designation || emp.role}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <span className="text-sm font-bold text-slate-700">{emp.total}</span>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            {editingId === emp.id ? (
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="19"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    className="w-16 text-center input-field text-sm py-1.5 px-2"
                                                    autoFocus
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') saveAdjustment(emp.id);
                                                        if (e.key === 'Escape') cancelEdit();
                                                    }}
                                                />
                                            ) : (
                                                <span className={`text-sm font-bold ${emp.leaveAdjustment > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                                                    {emp.leaveAdjustment}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <span className="text-sm font-bold text-indigo-600">{emp.approvedLeaves}</span>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <span className={`text-sm font-bold ${emp.used > emp.total ? 'text-red-600' : 'text-slate-700'}`}>
                                                {emp.used}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <span className={`inline-flex items-center gap-1 text-sm font-bold px-2.5 py-1 rounded-full ${emp.remaining > 5 ? 'bg-emerald-100 text-emerald-700' : emp.remaining > 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                                {emp.remaining > 0 && <HiOutlineCheckCircle className="w-3.5 h-3.5" />}
                                                {emp.remaining}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            {editingId === emp.id ? (
                                                <div className="flex gap-1.5">
                                                    <button
                                                        onClick={() => saveAdjustment(emp.id)}
                                                        disabled={saving}
                                                        className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors"
                                                        title="Save"
                                                    >
                                                        <HiOutlineCheckCircle className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={cancelEdit}
                                                        className="p-1.5 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-colors"
                                                        title="Cancel"
                                                    >
                                                        <HiOutlineXMark className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => startEdit(emp)}
                                                    className="p-1.5 bg-slate-100 text-slate-400 rounded-lg hover:bg-indigo-100 hover:text-indigo-600 transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Edit prior leaves"
                                                >
                                                    <HiOutlinePencilSquare className="w-4 h-4" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {employees.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="px-5 py-12 text-center text-slate-400 text-sm">
                                            No employees found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </motion.div>
        </DashboardLayout>
    );
}
