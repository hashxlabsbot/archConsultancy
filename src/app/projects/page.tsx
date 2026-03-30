'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    HiOutlineFolderOpen,
    HiOutlinePlus,
    HiOutlineDocumentText,
    HiOutlineUsers,
    HiOutlineMagnifyingGlass,
} from 'react-icons/hi2';
import { formatDate, getStatusBadgeColor } from '@/lib/utils';
import toast from 'react-hot-toast';
import LocationPicker from '@/components/projects/LocationPicker';

export default function ProjectsPage() {
    const { data: session } = useSession();
    const [projects, setProjects] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ name: '', client: '', startDate: '', endDate: '', description: '', location: '', latitude: '', longitude: '', contactName: '', contactPhone: '', contactEmail: '' });
    const role = (session?.user as any)?.role;

    useEffect(() => { fetchProjects(); }, [search]);

    const fetchProjects = async () => {
        try {
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            const res = await fetch(`/api/projects?${params}`);
            if (res.ok) {
                const data = await res.json();
                setProjects(data.projects);
            }
        } catch (err) { } finally { setLoading(false); }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (res.ok) {
                toast.success('Project created!');
                setShowForm(false);
                setForm({ name: '', client: '', startDate: '', endDate: '', description: '', location: '', latitude: '', longitude: '', contactName: '', contactPhone: '', contactEmail: '' });
                fetchProjects();
            } else {
                const data = await res.json();
                toast.error(data.error);
            }
        } catch (err) { toast.error('Failed'); }
    };

    return (
        <DashboardLayout>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
                        <p className="text-slate-500 mt-1">Manage architecture projects and documentation</p>
                    </div>
                    {(role === 'ADMIN' || role === 'SENIOR') && (
                        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
                            <HiOutlinePlus className="w-4 h-4" /> New Project
                        </button>
                    )}
                </div>

                {/* Search */}
                <div className="relative">
                    <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input className="input-field pl-10" placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>

                {/* Create Form */}
                {showForm && (
                    <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} onSubmit={handleCreate} className="glass-card p-6 space-y-4">
                        <h3 className="text-lg font-semibold text-slate-900">Create New Project</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div><label className="input-label">Project Name</label><input className="input-field" placeholder="Green Valley Residences" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
                            <div><label className="input-label">Client</label><input className="input-field" placeholder="Sunrise Developers" value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} required /></div>
                            <div><label className="input-label">Start Date</label><input type="date" className="input-field" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required /></div>
                            <div><label className="input-label">End Date</label><input type="date" className="input-field" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div><label className="input-label">Point of Contact</label><input className="input-field" placeholder="John Doe" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} /></div>
                            <div><label className="input-label">Contact Phone</label><input type="tel" className="input-field" placeholder="+1..." value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} /></div>
                            <div><label className="input-label">Contact Email</label><input type="email" className="input-field" placeholder="john@example.com" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} /></div>
                        </div>
                        <div>
                            <label className="input-label mb-2 block">Project Location (Search or drop pin)</label>
                            <LocationPicker
                                initialLocation={form.location}
                                onLocationSelect={(location, lat, lng) => setForm({
                                    ...form,
                                    location,
                                    latitude: lat ? lat.toString() : '',
                                    longitude: lng ? lng.toString() : ''
                                })}
                            />
                        </div>
                        <div><label className="input-label">Description</label><textarea className="input-field min-h-[80px]" placeholder="Project description..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                        <div className="flex gap-3">
                            <button type="submit" className="btn-primary">Create Project</button>
                            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
                        </div>
                    </motion.form>
                )}

                {/* Project Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projects.map((project, index) => (
                        <motion.div key={project.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                            <Link href={`/projects/${project.id}`}>
                                <div className="glass-card-hover p-5 h-full">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                                            <HiOutlineFolderOpen className="w-5 h-5 text-slate-900" />
                                        </div>
                                        <span className={`badge ${getStatusBadgeColor(project.status)}`}>{project.status}</span>
                                    </div>
                                    <h3 className="text-slate-900 font-semibold mb-1">{project.name}</h3>
                                    <p className="text-sm text-slate-500 mb-3">{project.client}</p>
                                    {project.description && <p className="text-xs text-slate-500 line-clamp-2 mb-3">{project.description}</p>}
                                    <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-gray-200/50">
                                        <span>{formatDate(project.startDate)}{project.endDate ? ` — ${formatDate(project.endDate)}` : ''}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="flex items-center gap-1"><HiOutlineUsers className="w-3.5 h-3.5" />{project._count?.members || 0}</span>
                                            <span className="flex items-center gap-1"><HiOutlineDocumentText className="w-3.5 h-3.5" />{project._count?.documents || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
                {projects.length === 0 && !loading && (
                    <div className="text-center py-12">
                        <HiOutlineFolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No projects yet</p>
                    </div>
                )}
            </motion.div>
        </DashboardLayout>
    );
}
