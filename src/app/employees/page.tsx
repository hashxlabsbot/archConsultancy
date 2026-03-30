'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import { HiOutlineUsers, HiOutlineMagnifyingGlass, HiOutlineEnvelope, HiOutlinePhone } from 'react-icons/hi2';
import { getInitials, getRoleBadgeColor } from '@/lib/utils';

export default function EmployeesPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchUsers(); }, [search, roleFilter]);

    const fetchUsers = async () => {
        try {
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            if (roleFilter) params.set('role', roleFilter);
            const res = await fetch(`/api/users?${params}`);
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users);
            }
        } catch (err) { } finally { setLoading(false); }
    };

    return (
        <DashboardLayout>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Employee Directory</h1>
                    <p className="text-slate-500 mt-1">Search and manage team members</p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                        <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            className="input-field pl-10"
                            placeholder="Search by name, email, or skills..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <select className="input-field w-auto" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                        <option value="">All Roles</option>
                        <option value="ADMIN">Principal Architect</option>
                        <option value="SENIOR">Senior</option>
                        <option value="JUNIOR">Junior</option>
                        <option value="TRAINEE">Trainee</option>
                        <option value="INTERN">Intern</option>
                        <option value="SITE_SUPERVISOR">Site Supervisor</option>
                        <option value="SITE_ENGINEER">Site Engineer</option>
                        <option value="NON_TECHNICAL">Non Technical</option>
                    </select>
                </div>

                {/* Employee Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {users.map((user, index) => (
                        <motion.div
                            key={user.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="glass-card-hover p-5"
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-slate-900 font-bold flex-shrink-0">
                                    {getInitials(user.name)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-slate-900 font-medium truncate">{user.name}</h3>
                                    <span className={`badge ${getRoleBadgeColor(user.role)} mt-1`}>{user.role}</span>
                                    {user.designation && (
                                        <p className="text-xs text-slate-500 mt-0.5 font-medium">{user.designation}</p>
                                    )}
                                    <div className="mt-2 space-y-1.5">
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <HiOutlineEnvelope className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                                            <span className="truncate">{user.email}</span>
                                        </div>
                                        {user.phone && (
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <HiOutlinePhone className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                                                <span>{user.phone}</span>
                                            </div>
                                        )}
                                        {user.joiningDate && (
                                            <div className="text-xs text-slate-400">
                                                Joined: {new Date(user.joiningDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </div>
                                        )}
                                    </div>
                                    {user.skills && (
                                        <div className="flex flex-wrap gap-1 mt-3">
                                            {user.skills.split(',').slice(0, 3).map((skill: string) => (
                                                <span key={skill} className="px-2 py-0.5 bg-white text-slate-500 rounded-md text-xs">
                                                    {skill.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
                {users.length === 0 && !loading && (
                    <div className="text-center py-12">
                        <HiOutlineUsers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No employees found</p>
                    </div>
                )}
            </motion.div>
        </DashboardLayout>
    );
}
