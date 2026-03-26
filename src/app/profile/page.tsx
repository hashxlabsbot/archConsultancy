'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import {
    HiOutlineUserCircle, HiOutlineEnvelope, HiOutlinePhone, HiOutlineIdentification,
    HiOutlineCalendarDays, HiOutlineBriefcase, HiOutlineAcademicCap, HiOutlineShieldCheck,
} from 'react-icons/hi2';

function Field({ label, value, icon: Icon }: { label: string; value?: string | null; icon?: any }) {
    return (
        <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
            {Icon && <Icon className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />}
            <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
                <p className="text-sm font-medium text-slate-800 mt-0.5 break-words">{value || <span className="text-slate-400 italic">Not set</span>}</p>
            </div>
        </div>
    );
}

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/profile/me')
            .then(r => r.json())
            .then(d => { if (d.user) setUser(d.user); })
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center items-center h-[60vh]">
                    <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    if (!user) return <DashboardLayout><p className="p-8 text-slate-500">Could not load profile.</p></DashboardLayout>;

    const initials = user.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

    const joiningDateFormatted = user.joiningDate
        ? new Date(user.joiningDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
        : null;

    const aadharMasked = user.aadharNo
        ? user.aadharNo.replace(/\d(?=\d{4})/g, 'X')
        : null;

    return (
        <DashboardLayout>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
                    <p className="text-slate-500 mt-1">Your complete employee profile as maintained by Arch Consultancy.</p>
                </div>

                {/* Identity Card */}
                <div className="glass-card overflow-hidden">
                    <div className="bg-gradient-to-r from-primary-600 to-primary-800 p-8 flex items-center gap-6">
                        <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-3xl font-bold text-white border-2 border-white/30 shadow-lg">
                            {initials}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">{user.name}</h2>
                            {user.designation && <p className="text-primary-200 mt-1 font-medium">{user.designation}</p>}
                            <span className="inline-flex mt-2 px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white border border-white/30">
                                {user.role}
                            </span>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8">
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Contact Details</h3>
                            <Field label="Email Address" value={user.email} icon={HiOutlineEnvelope} />
                            <Field label="Phone Number" value={user.phone} icon={HiOutlinePhone} />
                        </div>
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Employment</h3>
                            <Field label="Department / Role" value={user.role} icon={HiOutlineBriefcase} />
                            <Field label="Joining Date" value={joiningDateFormatted} icon={HiOutlineCalendarDays} />
                        </div>
                    </div>
                </div>

                {/* Service Book Details */}
                <div className="glass-card p-6">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4 pb-2 border-b border-gray-100">
                        Service Book Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                        <div>
                            <Field label="Father's Name" value={user.fathersName} icon={HiOutlineUserCircle} />
                            <Field label="Designation" value={user.designation} icon={HiOutlineBriefcase} />
                        </div>
                        <div>
                            <Field label="PAN Card Number" value={user.panCard} icon={HiOutlineIdentification} />
                            <Field label="Aadhar Number" value={aadharMasked} icon={HiOutlineShieldCheck} />
                        </div>
                    </div>
                </div>

                {/* Skills */}
                {user.skills && (
                    <div className="glass-card p-6">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
                            <HiOutlineAcademicCap className="w-4 h-4" /> Skills & Expertise
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {user.skills.split(',').map((s: string) => (
                                <span key={s} className="px-3 py-1.5 bg-primary-50 text-primary-700 border border-primary-200 rounded-lg text-sm font-medium">
                                    {s.trim()}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                <p className="text-center text-xs text-slate-400 pb-4">
                    To update any of these details, please contact your Administrator.
                </p>
            </motion.div>
        </DashboardLayout>
    );
}
