'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineBanknotes, HiOutlineDocumentText, HiXMark, HiOutlinePrinter, HiOutlineUserCircle } from 'react-icons/hi2';
import SalarySlipDocument from '@/components/salary/SalarySlipDocument';

export default function EmployeeSalaryPage() {
    const [structure, setStructure] = useState<any>(null);
    const [slips, setSlips] = useState<any[]>([]);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedSlip, setSelectedSlip] = useState<any>(null);

    useEffect(() => {
        Promise.all([
            fetch('/api/salary').then(r => r.json()),
            fetch('/api/profile/me').then(r => r.json()),
        ]).then(([salaryData, profileData]) => {
            if (salaryData.structure) setStructure(salaryData.structure);
            if (salaryData.slips) setSlips(salaryData.slips);
            if (profileData.user) setProfile(profileData.user);
        }).catch(err => console.error('Failed to load:', err))
            .finally(() => setLoading(false));
    }, []);

    const handlePrint = () => {
        const slipEl = document.getElementById(`salary-slip-${selectedSlip?.id}`);
        if (!slipEl) return;
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        printWindow.document.write(`
            <html>
            <head>
                <title>Salary Slip - ${selectedSlip.month} ${selectedSlip.year}</title>
                <style>
                    @media print { 
                        @page { margin: 0; size: A4 portrait; }
                        body { margin: 0; padding: 10mm 15mm; display: block; }
                        .salary-slip-container { max-width: none !important; width: 100% !important; height: fit-content; }
                    }
                    body { font-family: 'Times New Roman', serif; background: white; padding: 20px; display: flex; justify-content: center; align-items: flex-start; }
                </style>
            </head>
            <body>${slipEl.outerHTML}</body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center items-center h-[60vh]">
                    <div className="w-10 h-10 border-3 border-emerald-200 border-t-emerald-500 rounded-full animate-spin"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6 max-w-[1400px]">

                {/* ── Header ── */}
                <div className="glass-card p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif', letterSpacing: '-0.02em' }}>
                            My Salary & Payslips
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">View your financial profile and download official payslips.</p>
                    </div>
                </div>

                {/* ── Employee Profile Card ── */}
                {profile && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, duration: 0.4 }} className="glass-card p-4 sm:p-6 flex flex-col sm:flex-row flex-wrap gap-4 sm:gap-6 items-start sm:items-center relative overflow-hidden group border-2 border-white/60">
                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-100 rounded-full opacity-40 group-hover:scale-150 transition-transform duration-700 pointer-events-none blur-3xl" />

                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-3xl font-extrabold text-emerald-700 border border-emerald-200 shadow-sm relative z-10">
                            {profile.name?.charAt(0)}
                        </div>
                        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 relative z-10 w-full">
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1 pb-1 border-b border-slate-100/80 inline-block w-full">Employee Name</p>
                                <p className="text-sm font-bold text-slate-900 truncate" title={profile.name}>{profile.name}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1 pb-1 border-b border-slate-100/80 inline-block w-full">Designation</p>
                                <p className="text-sm font-bold text-slate-900 truncate" title={profile.designation}>{profile.designation || '—'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1 pb-1 border-b border-slate-100/80 inline-block w-full">Date of Joining</p>
                                <p className="text-sm font-bold text-slate-900">{profile.joiningDate ? new Date(profile.joiningDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1 pb-1 border-b border-slate-100/80 inline-block w-full">PAN Card</p>
                                <p className="text-sm font-black tracking-wider text-slate-900">{profile.panCard || '—'}</p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {!structure ? (
                    <div className="glass-card p-12 text-center max-w-2xl mx-auto mt-10">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <HiOutlineBanknotes className="w-12 h-12 text-slate-300" />
                        </div>
                        <h2 className="text-2xl font-extrabold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>Financial Profile Pending</h2>
                        <p className="text-slate-500 mt-2">Your salary structure has not been configured by the administrators yet. Please check back later.</p>
                    </div>
                ) : (
                    <>
                        {/* ── Salary Structure Breakdown ── */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card overflow-hidden">
                            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-6 text-white relative flex justify-between items-center">
                                <div className="absolute inset-0 arch-blueprint-grid opacity-20 filter invert opacity-[0.15]"></div>
                                <h2 className="text-xl font-bold flex items-center gap-2 relative z-10" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                    <HiOutlineBanknotes className="w-6 h-6" /> Salary Structure Breakdown
                                </h2>
                                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center relative z-10">
                                    <HiOutlineUserCircle className="w-6 h-6 text-white" />
                                </div>
                            </div>

                            <div className="p-4 sm:p-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 bg-white/40">
                                <div>
                                    <p className="text-xs font-bold text-emerald-800 uppercase tracking-widest mb-1">Base Salary</p>
                                    <p className="text-2xl sm:text-4xl font-extrabold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                        ₹{structure.basicSalary.toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">HRA</p>
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-2xl font-extrabold text-slate-800">{structure.hraRate}%</p>
                                        <span className="text-xs font-bold text-slate-400 tracking-wider">OF BASIC</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">DA</p>
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-2xl font-extrabold text-slate-800">{structure.daRate}%</p>
                                        <span className="text-xs font-bold text-slate-400 tracking-wider">OF BASIC</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Annual Incentive</p>
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-2xl font-extrabold text-slate-800">{structure.annualIncentiveRate}%</p>
                                        <span className="text-xs font-bold text-slate-400 tracking-wider">OF BASIC</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Fixed Monthly Allowances</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    {[
                                        ['Medical Relief', structure.medicalAllowance],
                                        ['Mobile Reimbursement', structure.mobileAllowance],
                                        ['Travel Allowance', structure.travelAllowance],
                                        ['Seniority Bonus', structure.seniorityAllowance]
                                    ].map(([label, val]) => (
                                        <div key={label} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100/80 hover:border-emerald-200 transition-colors">
                                            <p className="text-[10px] text-slate-500 font-bold mb-1 uppercase tracking-widest">{label}</p>
                                            <p className="text-xl font-extrabold text-emerald-700" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                                ₹{Number(val).toLocaleString()}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>

                        {/* ── Salary Slips Table ── */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white/50">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                        <div className="w-2 h-6 rounded-full bg-emerald-500" />
                                        Monthly Salary Slips
                                    </h2>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Official Payment Records</p>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50 border-b border-slate-100/80">
                                            <th className="text-xs font-bold text-slate-500 uppercase tracking-wider px-6 py-4">Generation Period</th>
                                            <th className="text-right text-xs font-bold text-slate-500 uppercase tracking-wider px-6 py-4">Basic Pay</th>
                                            <th className="text-right text-xs font-bold text-slate-500 uppercase tracking-wider px-6 py-4">Gross Earnings</th>
                                            <th className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider px-6 py-4">Status</th>
                                            <th className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider px-6 py-4">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100/80">
                                        {slips.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="py-12 text-center text-slate-400">
                                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                                                        <HiOutlineDocumentText className="w-6 h-6 text-slate-300" />
                                                    </div>
                                                    No salary slips have been generated yet.
                                                </td>
                                            </tr>
                                        ) : slips.map((slip) => (
                                            <tr key={slip.id} className="hover:bg-emerald-50/30 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-extrabold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                                        {slip.month} {slip.year}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold text-slate-600 text-right">
                                                    ₹{slip.basicSalary.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-base font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-md border border-emerald-100">
                                                        ₹{slip.grossSalary.toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-flex px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${slip.status === 'PAID'
                                                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                                        : 'bg-indigo-100 text-indigo-800 border-indigo-200'
                                                        }`}>
                                                        {slip.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button onClick={() => setSelectedSlip(slip)} className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border border-slate-200 hover:border-emerald-200 shadow-sm opacity-80 group-hover:opacity-100">
                                                        <HiOutlineDocumentText className="w-4 h-4" /> View Payslip
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    </>
                )}
            </motion.div>

            {/* ── Payslip View Modal ── */}
            <AnimatePresence>
                {selectedSlip && (
                    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-full"
                        >
                            {/* Toolbar */}
                            <div className="flex-shrink-0 bg-slate-50 border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                                <div>
                                    <h3 className="font-extrabold text-slate-900 text-lg" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                        Official Salary Slip
                                    </h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                        {selectedSlip.month} {selectedSlip.year}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button onClick={handlePrint} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-emerald-700 transition shadow-glow-emerald">
                                        <HiOutlinePrinter className="w-4 h-4" /> Print / PDF
                                    </button>
                                    <button onClick={() => setSelectedSlip(null)} className="p-2 text-slate-400 hover:text-rose-600 bg-white hover:bg-rose-50 rounded-xl transition-colors border border-gray-200 shadow-sm">
                                        <HiXMark className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Scrollable Document Area */}
                            <div className="flex-1 overflow-y-auto bg-slate-100/50 flex justify-center py-8 px-4">
                                <div className="w-full max-w-[820px] shadow-sm">
                                    {profile ? (
                                        <SalarySlipDocument slip={selectedSlip} employee={profile} />
                                    ) : (
                                        <SalarySlipDocument slip={selectedSlip} employee={{ name: 'Employee' }} />
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Hidden rendered slips for direct window.print targeting */}
            <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                {slips.map(slip => (
                    <SalarySlipDocument key={slip.id} slip={slip} employee={profile || { name: '' }} />
                ))}
            </div>
        </DashboardLayout>
    );
}
