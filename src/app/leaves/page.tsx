'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import {
    HiOutlineCalendarDays,
    HiOutlinePlus,
    HiOutlineCheck,
    HiOutlineXMark,
} from 'react-icons/hi2';
import { formatDate, getStatusBadgeColor } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function LeavesPage() {
    const { data: session } = useSession();
    const [leaves, setLeaves] = useState<any[]>([]);
    const [balance, setBalance] = useState({ total: 24, used: 0, remaining: 24 });
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ type: 'FULL', startDate: '', endDate: '', reason: '' });
    const role = (session?.user as any)?.role;

    useEffect(() => { fetchLeaves(); }, []);

    const fetchLeaves = async () => {
        try {
            const res = await fetch('/api/leaves');
            if (res.ok) {
                const data = await res.json();
                setLeaves(data.leaves);
                if (data.balance) setBalance(data.balance);
            }
        } catch (err) { } finally { setLoading(false); }
    };

    const handleApply = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/leaves', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (res.ok) {
                toast.success('Leave applied!');
                setShowForm(false);
                setForm({ type: 'FULL', startDate: '', endDate: '', reason: '' });
                fetchLeaves();
            } else {
                const data = await res.json();
                toast.error(data.error);
            }
        } catch (err) { toast.error('Failed to apply'); }
    };

    const handleAction = async (id: string, action: string) => {
        try {
            const res = await fetch(`/api/leaves/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action }),
            });
            if (res.ok) {
                toast.success(`Leave ${action.toLowerCase()}`);
                fetchLeaves();
            }
        } catch (err) { toast.error('Action failed'); }
    };

    return (
        <DashboardLayout>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Leave Management</h1>
                        <p className="text-slate-500 mt-1">Apply for leave and track your balance</p>
                    </div>
                    <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
                        <HiOutlinePlus className="w-4 h-4" /> Apply Leave
                    </button>
                </div>

                {/* Balance Cards */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="glass-card p-5 text-center">
                        <p className="text-3xl font-bold text-slate-900">{balance.total}</p>
                        <p className="text-sm text-slate-500 mt-1">Total Leaves</p>
                    </div>
                    <div className="glass-card p-5 text-center">
                        <p className="text-3xl font-bold text-warning-400">{balance.used}</p>
                        <p className="text-sm text-slate-500 mt-1">Used</p>
                    </div>
                    <div className="glass-card p-5 text-center">
                        <p className="text-3xl font-bold text-success-400">{balance.remaining}</p>
                        <p className="text-sm text-slate-500 mt-1">Remaining</p>
                    </div>
                </div>

                {/* Apply Form */}
                {showForm && (
                    <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} onSubmit={handleApply} className="glass-card p-6 space-y-4">
                        <h3 className="text-lg font-semibold text-slate-900">Apply for Leave</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="input-label">Type</label>
                                <select className="input-field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                                    <option value="FULL">Full Day</option>
                                    <option value="HALF">Half Day</option>
                                    <option value="CUSTOM">Custom</option>
                                </select>
                            </div>
                            <div>
                                <label className="input-label">Start Date</label>
                                <input type="date" className="input-field" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
                            </div>
                            <div>
                                <label className="input-label">End Date</label>
                                <input type="date" className="input-field" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
                            </div>
                        </div>
                        <div>
                            <label className="input-label">Reason</label>
                            <textarea className="input-field min-h-[80px]" placeholder="Reason for leave..." value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required />
                        </div>
                        <div className="flex gap-3">
                            <button type="submit" className="btn-primary">Submit</button>
                            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
                        </div>
                    </motion.form>
                )}

                {/* Leave List */}
                <div className="glass-card overflow-hidden">
                    <div className="p-5 border-b border-gray-200/50">
                        <h2 className="text-lg font-semibold text-slate-900">Leave Requests</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-white/50">
                                    {(role !== 'EMPLOYEE') && <th className="text-left text-sm text-slate-500 px-5 py-3 font-medium">Employee</th>}
                                    <th className="text-left text-sm text-slate-500 px-5 py-3 font-medium">Type</th>
                                    <th className="text-left text-sm text-slate-500 px-5 py-3 font-medium">From</th>
                                    <th className="text-left text-sm text-slate-500 px-5 py-3 font-medium">To</th>
                                    <th className="text-left text-sm text-slate-500 px-5 py-3 font-medium">Reason</th>
                                    <th className="text-left text-sm text-slate-500 px-5 py-3 font-medium">Status</th>
                                    {(role === 'MANAGER' || role === 'ADMIN') && <th className="text-left text-sm text-slate-500 px-5 py-3 font-medium">Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {leaves.map((leave) => (
                                    <tr key={leave.id} className="border-t border-gray-200/50 hover:bg-white/30 transition-colors">
                                        {(role !== 'EMPLOYEE') && <td className="px-5 py-3 text-sm text-slate-900">{leave.user?.name}</td>}
                                        <td className="px-5 py-3 text-sm text-slate-600">{leave.type}</td>
                                        <td className="px-5 py-3 text-sm text-slate-600">{formatDate(leave.startDate)}</td>
                                        <td className="px-5 py-3 text-sm text-slate-600">{formatDate(leave.endDate)}</td>
                                        <td className="px-5 py-3 text-sm text-slate-500 max-w-xs truncate">{leave.reason}</td>
                                        <td className="px-5 py-3"><span className={`badge ${getStatusBadgeColor(leave.status)}`}>{leave.status}</span></td>
                                        {(role === 'MANAGER' || role === 'ADMIN') && (
                                            <td className="px-5 py-3">
                                                {leave.status === 'PENDING' && (
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleAction(leave.id, 'APPROVED')} className="p-1.5 bg-success-500/10 text-success-400 rounded-lg hover:bg-success-500/20">
                                                            <HiOutlineCheck className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => handleAction(leave.id, 'REJECTED')} className="p-1.5 bg-danger-500/10 text-danger-400 rounded-lg hover:bg-danger-500/20">
                                                            <HiOutlineXMark className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {leaves.length === 0 && !loading && <p className="text-center text-slate-500 py-8">No leave requests</p>}
                    </div>
                </div>
            </motion.div>
        </DashboardLayout>
    );
}
