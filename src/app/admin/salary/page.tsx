'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineCurrencyRupee, HiPencil, HiXMark, HiOutlineDocumentText, HiOutlineCog6Tooth, HiOutlineCheckCircle } from 'react-icons/hi2';
import { getInitials } from '@/lib/utils';
import toast from 'react-hot-toast';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function AdminSalaryPage() {
    const [tab, setTab] = useState<'config' | 'slips'>('config');
    const [users, setUsers] = useState<any[]>([]);
    const [slips, setSlips] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    // Filter state for slips
    const currentDate = new Date();
    const [filterMonth, setFilterMonth] = useState(MONTHS[currentDate.getMonth()]);
    const [filterYear, setFilterYear] = useState(currentDate.getFullYear());

    // Modal State
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [formData, setFormData] = useState({
        basicSalary: 0, hraRate: 50, daRate: 10,
        medicalAllowance: 0, mobileAllowance: 0, travelAllowance: 0, seniorityAllowance: 0, annualIncentiveRate: 5,
        annualIncentiveMonth: 'January'
    });

    useEffect(() => { fetchUsers(); }, []);
    useEffect(() => { if (tab === 'slips') fetchSlips(); }, [tab, filterMonth, filterYear]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/salary-structures');
            if (res.ok) setUsers((await res.json()).users);
        } catch { toast.error('Failed to load users'); }
        finally { setLoading(false); }
    };

    const fetchSlips = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/salary-slips?month=${filterMonth}&year=${filterYear}`);
            if (res.ok) setSlips((await res.json()).slips);
        } catch { toast.error('Failed to load slips'); }
        finally { setLoading(false); }
    };

    const openConfigModal = (user: any) => {
        setSelectedUser(user);
        const s = user.salaryStructure;
        setFormData(s ? {
            basicSalary: s.basicSalary, hraRate: s.hraRate, daRate: s.daRate,
            medicalAllowance: s.medicalAllowance, mobileAllowance: s.mobileAllowance,
            travelAllowance: s.travelAllowance, seniorityAllowance: s.seniorityAllowance,
            annualIncentiveRate: s.annualIncentiveRate, annualIncentiveMonth: s.annualIncentiveMonth || 'January'
        } : { basicSalary: 0, hraRate: 50, daRate: 10, medicalAllowance: 750, mobileAllowance: 1500, travelAllowance: 2500, seniorityAllowance: 1000, annualIncentiveRate: 5, annualIncentiveMonth: 'January' });
        setIsConfigModalOpen(true);
    };

    const handleSaveStructure = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`/api/admin/salary-structures/${selectedUser.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
            if (res.ok) { toast.success('Salary structure saved!'); setIsConfigModalOpen(false); fetchUsers(); }
            else toast.error('Failed to save');
        } catch { toast.error('Error saving structure'); }
    };

    const handleTogglePaid = async (slipId: string) => {
        // Optimistic update
        setSlips(prev => prev.map(s => s.id === slipId ? { ...s, status: s.status === 'PAID' ? 'GENERATED' : 'PAID' } : s));
        try {
            const res = await fetch(`/api/admin/salary-slips/${slipId}`, { method: 'PATCH' });
            if (!res.ok) {
                // Revert on failure
                setSlips(prev => prev.map(s => s.id === slipId ? { ...s, status: s.status === 'PAID' ? 'GENERATED' : 'PAID' } : s));
                toast.error('Failed to update status');
            }
        } catch {
            setSlips(prev => prev.map(s => s.id === slipId ? { ...s, status: s.status === 'PAID' ? 'GENERATED' : 'PAID' } : s));
            toast.error('Failed to update status');
        }
    };

    const handleGenerateSlips = async () => {
        setGenerating(true);
        try {
            const res = await fetch('/api/admin/salary-slips/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ month: filterMonth, year: filterYear }) });
            const data = await res.json();
            if (res.ok) { toast.success(data.message); fetchSlips(); }
            else toast.error(data.error || 'Failed to generate');
        } catch { toast.error('Error generating slips'); }
        finally { setGenerating(false); }
    };

    const configuredCount = users.filter(u => u.salaryStructure).length;

    return (
        <DashboardLayout>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center bg-gradient-to-r from-emerald-600 to-teal-600 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
                    <div className="relative z-10">
                        <h1 className="text-3xl font-bold tracking-tight">Salary Management</h1>
                        <p className="text-emerald-50 mt-2 text-lg">{configuredCount} of {users.length} employees configured</p>
                    </div>
                    <HiOutlineCurrencyRupee className="w-48 h-48 absolute -right-6 -bottom-10 text-white/10 rotate-12" />
                </div>

                {/* Tabs */}
                <div className="flex gap-2 bg-white/60 backdrop-blur p-1 rounded-xl border border-gray-200 w-fit">
                    <button onClick={() => setTab('config')} className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'config' ? 'bg-emerald-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}>
                        <HiOutlineCog6Tooth className="w-4 h-4" /> Employee Setup
                    </button>
                    <button onClick={() => setTab('slips')} className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'slips' ? 'bg-emerald-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}>
                        <HiOutlineDocumentText className="w-4 h-4" /> Monthly Slips
                    </button>
                </div>

                {/* Tab: Employee Configuration */}
                {tab === 'config' && (
                    <div className="glass-card overflow-hidden">
                        <div className="p-5 border-b border-gray-200/50 bg-white/50">
                            <h2 className="text-lg font-semibold text-slate-900">Configure Employee Salaries</h2>
                            <p className="text-sm text-slate-500 mt-0.5">Set once. Edit anytime. Auto-used for monthly slip generation.</p>
                        </div>
                        <div className="overflow-x-auto min-h-[300px]">
                            {loading ? (
                                <div className="flex justify-center items-center h-64"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>
                            ) : (
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-50/80 border-b border-gray-200">
                                            <th className="text-left text-sm text-slate-500 px-5 py-3 font-medium">Employee</th>
                                            <th className="text-left text-sm text-slate-500 px-5 py-3 font-medium">Basic</th>
                                            <th className="text-left text-sm text-slate-500 px-5 py-3 font-medium">HRA%</th>
                                            <th className="text-left text-sm text-slate-500 px-5 py-3 font-medium">DA%</th>
                                            <th className="text-left text-sm text-slate-500 px-5 py-3 font-medium">Fixed Allowances</th>
                                            <th className="text-center text-sm text-slate-500 px-5 py-3 font-medium">Status</th>
                                            <th className="text-center text-sm text-slate-500 px-5 py-3 font-medium">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white">
                                        {users.map((user) => {
                                            const s = user.salaryStructure;
                                            const fixed = s ? s.medicalAllowance + s.mobileAllowance + s.travelAllowance + s.seniorityAllowance : 0;
                                            return (
                                                <tr key={user.id} className="border-b border-gray-100 hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-5 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-xs text-emerald-700 font-bold">{getInitials(user.name)}</div>
                                                            <div>
                                                                <p className="text-sm font-medium text-slate-900">{user.name}</p>
                                                                <p className="text-xs text-slate-400">{user.role}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3 text-sm font-bold text-slate-800">₹{s ? s.basicSalary.toLocaleString() : '—'}</td>
                                                    <td className="px-5 py-3 text-sm text-slate-600">{s ? `${s.hraRate}%` : '—'}</td>
                                                    <td className="px-5 py-3 text-sm text-slate-600">{s ? `${s.daRate}%` : '—'}</td>
                                                    <td className="px-5 py-3 text-sm text-slate-600">₹{fixed.toLocaleString()}</td>
                                                    <td className="px-5 py-3 text-center">
                                                        {s ? <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">Configured</span>
                                                            : <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">Not Set</span>}
                                                    </td>
                                                    <td className="px-5 py-3 flex justify-center">
                                                        <button onClick={() => openConfigModal(user)} className="px-3 py-1.5 flex items-center gap-1.5 text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition border border-slate-200 hover:border-emerald-200">
                                                            <HiPencil className="w-3.5 h-3.5" />{s ? 'Edit' : 'Setup'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}

                {/* Tab: Monthly Slips */}
                {tab === 'slips' && (
                    <div className="space-y-4">
                        <div className="glass-card p-5 flex flex-wrap gap-4 items-end border-b border-gray-100">
                            <div>
                                <label className="input-label">Month</label>
                                <select className="input-field" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
                                    {MONTHS.map(m => <option key={m}>{m}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="input-label">Year</label>
                                <input type="number" className="input-field" value={filterYear} min={2020} max={2099} onChange={e => setFilterYear(Number(e.target.value))} />
                            </div>
                            <button onClick={handleGenerateSlips} disabled={generating} className="px-6 py-2 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow border border-emerald-700 disabled:opacity-60 flex items-center gap-2">
                                {generating ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : <HiOutlineDocumentText className="w-4 h-4" />}
                                {generating ? 'Generating...' : `Generate ${filterMonth} ${filterYear} Slips`}
                            </button>
                        </div>

                        <div className="glass-card overflow-hidden">
                            <div className="p-5 border-b border-gray-100 bg-white/50">
                                <h2 className="text-lg font-semibold text-slate-900">{filterMonth} {filterYear} — Salary Slips</h2>
                            </div>
                            <div className="overflow-x-auto">
                                {loading ? (
                                    <div className="flex justify-center items-center h-48"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>
                                ) : (
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-gray-50/80 border-b border-gray-200">
                                                <th className="text-left text-sm text-slate-500 px-5 py-3 font-medium">Employee</th>
                                                <th className="text-right text-sm text-slate-500 px-5 py-3 font-medium">Basic</th>
                                                <th className="text-right text-sm text-slate-500 px-5 py-3 font-medium">HRA</th>
                                                <th className="text-right text-sm text-slate-500 px-5 py-3 font-medium">DA</th>
                                                <th className="text-right text-sm text-slate-500 px-5 py-3 font-medium">Fixed Allow.</th>
                                                <th className="text-right text-sm text-slate-500 px-5 py-3 font-medium">Leave Allow.</th>
                                                <th className="text-right text-sm text-slate-500 px-5 py-3 font-medium">Incentive</th>
                                                <th className="text-right text-sm text-slate-500 px-5 py-3 font-medium font-bold">Gross</th>
                                                <th className="text-center text-sm text-slate-500 px-5 py-3 font-medium">Status</th>
                                                <th className="text-center text-sm text-slate-500 px-5 py-3 font-medium">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white">
                                            {slips.length === 0 ? (
                                                <tr><td colSpan={10} className="px-5 py-10 text-center text-slate-500">No slips generated for {filterMonth} {filterYear}. Click "Generate" to create them.</td></tr>
                                            ) : slips.map((slip) => (
                                                <tr key={slip.id} className="border-b border-gray-100 hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-5 py-3">
                                                        <p className="text-sm font-medium text-slate-900">{slip.user?.name}</p>
                                                        <p className="text-xs text-slate-400">{slip.user?.email}</p>
                                                    </td>
                                                    <td className="px-5 py-3 text-right text-sm text-slate-700">₹{slip.basicSalary.toLocaleString()}</td>
                                                    <td className="px-5 py-3 text-right text-sm text-slate-600">₹{slip.houseRentAllowance.toLocaleString()}</td>
                                                    <td className="px-5 py-3 text-right text-sm text-slate-600">₹{slip.dearnessAllowance.toLocaleString()}</td>
                                                    <td className="px-5 py-3 text-right text-sm text-slate-600">₹{(slip.medicalAllowance + slip.mobileAllowance + slip.travelAllowance + slip.seniorityAllowance).toLocaleString()}</td>
                                                    <td className="px-5 py-3 text-right text-sm text-slate-600">₹{slip.leaveAllowance.toLocaleString()}</td>
                                                    <td className="px-5 py-3 text-right text-sm text-slate-600">₹{slip.annualIncentive.toLocaleString()}</td>
                                                    <td className="px-5 py-3 text-right text-sm font-bold text-emerald-700">₹{slip.grossSalary.toLocaleString()}</td>
                                                    <td className="px-5 py-3 text-center">
                                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${slip.status === 'PAID' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-blue-100 text-blue-700 border border-blue-200'}`}>{slip.status}</span>
                                                    </td>
                                                    <td className="px-5 py-3 text-center">
                                                        <button
                                                            onClick={() => handleTogglePaid(slip.id)}
                                                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${slip.status === 'PAID' ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'}`}
                                                        >
                                                            <HiOutlineCheckCircle className="w-3.5 h-3.5" />
                                                            {slip.status === 'PAID' ? 'Unmark' : 'Mark Paid'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>

            {/* Config Modal */}
            <AnimatePresence>
                {isConfigModalOpen && selectedUser && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto py-10">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-100 my-auto">
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-emerald-50/50">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Salary Structure — {selectedUser.name}</h3>
                                    <p className="text-sm text-slate-400 mt-0.5">{selectedUser.email}</p>
                                </div>
                                <button onClick={() => setIsConfigModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg"><HiXMark className="w-6 h-6" /></button>
                            </div>
                            <form onSubmit={handleSaveStructure} className="p-6 space-y-6">
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 pb-2 border-b">Base Salary</h4>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="input-label">Basic Salary (₹)</label>
                                            <input type="number" required min="0" className="input-field" value={formData.basicSalary} onFocus={(e) => e.target.select()} onChange={e => setFormData({ ...formData, basicSalary: Number(e.target.value) })} />
                                        </div>
                                        <div>
                                            <label className="input-label">HRA % of Basic</label>
                                            <input type="number" required min="0" max="100" className="input-field" value={formData.hraRate} onFocus={(e) => e.target.select()} onChange={e => setFormData({ ...formData, hraRate: Number(e.target.value) })} />
                                        </div>
                                        <div>
                                            <label className="input-label">DA % of Basic</label>
                                            <input type="number" required min="0" max="100" className="input-field" value={formData.daRate} onFocus={(e) => e.target.select()} onChange={e => setFormData({ ...formData, daRate: Number(e.target.value) })} />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 pb-2 border-b">Fixed Monthly Allowances</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        {[['medicalAllowance', 'Medical (₹)'], ['mobileAllowance', 'Mobile (₹)'], ['travelAllowance', 'Travel (₹)'], ['seniorityAllowance', 'Seniority (₹)']].map(([key, label]) => (
                                            <div key={key}>
                                                <label className="input-label">{label}</label>
                                                <input type="number" required min="0" className="input-field" value={(formData as any)[key]} onFocus={(e) => e.target.select()} onChange={e => setFormData({ ...formData, [key]: Number(e.target.value) })} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 pb-2 border-b">Annual Incentive</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="input-label">Incentive Rate (% of Basic/yr)</label>
                                            <input type="number" required min="0" max="100" className="input-field" value={formData.annualIncentiveRate} onFocus={(e) => e.target.select()} onChange={e => setFormData({ ...formData, annualIncentiveRate: Number(e.target.value) })} />
                                        </div>
                                        <div>
                                            <label className="input-label">Payout Month</label>
                                            <select className="input-field" value={formData.annualIncentiveMonth} onChange={e => setFormData({ ...formData, annualIncentiveMonth: e.target.value })}>
                                                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-4 border-t flex justify-end gap-3">
                                    <button type="button" onClick={() => setIsConfigModalOpen(false)} className="btn-secondary">Cancel</button>
                                    <button type="submit" className="px-6 py-2 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition border border-emerald-700 shadow">Save Configuration</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
}
