'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { HiOutlineMapPin, HiPlus, HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi2';

export default function SiteVisitsPage() {
    const { data: session } = useSession();
    const [visits, setVisits] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

    useEffect(() => {
        fetchProjects();
    }, []);

    useEffect(() => {
        fetchVisits(page, selectedProjectId);
    }, [page, selectedProjectId]);

    const fetchProjects = async () => {
        try {
            const res = await fetch('/api/projects');
            if (res.ok) {
                const data = await res.json();
                setProjects(data.projects || []);
            }
        } catch { }
    };

    const fetchVisits = async (p: number, projId: string) => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                page: String(p),
                limit: '15'
            });
            if (projId) query.set('projectId', projId);

            const res = await fetch(`/api/site-visits?${query.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setVisits(data.visits || []);
                if (data.pagination) setPagination(data.pagination);
            }
        } catch (e) { } finally {
            setLoading(false);
        }
    };

    const getPurposeStyles = (purpose: string) => {
        const styles: Record<string, string> = {
            'Site Inspection': 'bg-indigo-50 text-indigo-700 border-indigo-100',
            'Client Meeting': 'bg-emerald-50 text-emerald-700 border-emerald-100',
            'Quality Check': 'bg-amber-50 text-amber-700 border-amber-100',
            'Progress Audit': 'bg-sky-50 text-sky-700 border-sky-100',
            'Material Verification': 'bg-rose-50 text-rose-700 border-rose-100',
            'default': 'bg-slate-50 text-slate-700 border-slate-100'
        };
        return styles[purpose] || styles['default'];
    };

    return (
        <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>Project Site Visits & Compliance</h1>
                    <p className="text-slate-500 text-sm mt-1">Track on-site activities with GPS verification and photo documentation.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative min-w-[200px]">
                        <select
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:border-indigo-300 transition-colors focus:ring-2 focus:ring-indigo-100 focus:outline-none appearance-none pr-10"
                            value={selectedProjectId}
                            onChange={(e) => { setSelectedProjectId(e.target.value); setPage(1); }}
                        >
                            <option value="">All Projects</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                        </div>
                    </div>
                    <Link href="/site-visits/new" className="btn-primary flex items-center justify-center gap-2 py-2.5 shadow-glow-indigo">
                        <HiPlus className="w-5 h-5" />
                        <span>Log New Visit</span>
                    </Link>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
                    <p className="text-slate-500 font-medium">Fetching field logs...</p>
                </div>
            ) : visits.length === 0 ? (
                <div className="glass-card p-16 text-center max-w-lg mx-auto">
                    <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <HiOutlineMapPin className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">No Site Visits Found</h3>
                    <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                        {selectedProjectId
                            ? "There are no visits logged for this specific project yet."
                            : "Your Project Site activity log is empty. Start tracking your site visits with GPS and photo proof."}
                    </p>
                    <Link href="/site-visits/new" className="btn-primary inline-flex px-8">Log First Visit</Link>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {visits.map((visit, i) => (
                            <motion.div
                                key={visit.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="glass-card overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/5 transition-all group border-slate-100/50"
                            >
                                {/* Card Header */}
                                <div className="p-5 border-b border-slate-100/80 bg-white/50 backdrop-blur-sm">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-slate-900 truncate pr-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                                {visit.project?.name}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                                <span>{new Date(visit.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                <span className="text-indigo-500/80">{visit.user?.name}</span>
                                            </div>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${getPurposeStyles(visit.purpose || 'Site Visit')}`}>
                                            {visit.purpose || 'Site Visit'}
                                        </span>
                                    </div>
                                </div>

                                {/* Location Banner */}
                                {(visit.latitude || visit.address) && (
                                    <div className="px-5 py-3 bg-slate-50/50 flex items-center justify-between gap-3 group-hover:bg-indigo-50/30 transition-colors">
                                        <div className="flex items-start gap-2 min-w-0">
                                            <HiOutlineMapPin className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                                            <div className="min-w-0 overflow-hidden">
                                                <p className="text-xs font-bold text-slate-700 truncate">{visit.address || 'Geo-verified Location'}</p>
                                                {visit.latitude && (
                                                    <p className="text-[10px] text-slate-400 font-mono mt-0.5 tracking-tight">
                                                        {visit.latitude.toFixed(5)}, {visit.longitude.toFixed(5)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        {visit.latitude && (
                                            <a
                                                href={`https://www.google.com/maps?q=${visit.latitude},${visit.longitude}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="shrink-0 p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
                                                title="View on Maps"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" /></svg>
                                            </a>
                                        )}
                                    </div>
                                )}

                                {/* Visit Notes */}
                                <div className="p-5 flex-1 flex flex-col">
                                    <div className="relative">
                                        <div className="absolute left-0 top-0 w-1 h-full bg-slate-100 rounded-full" />
                                        <p className="text-sm text-slate-600 pl-4 whitespace-pre-wrap line-clamp-4 leading-relaxed bg-white rounded-lg p-2 italic group-hover:not-italic transition-all duration-300">
                                            "{visit.notes}"
                                        </p>
                                    </div>

                                    {/* Photos Grid */}
                                    {visit.photoUrls && (
                                        <div className="mt-5">
                                            <div className="grid grid-cols-4 gap-2">
                                                {JSON.parse(visit.photoUrls).map((url: string, pi: number) => (
                                                    <div
                                                        key={pi}
                                                        className="aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer hover:border-indigo-400 transition-colors relative group/img"
                                                        onClick={() => window.open(`/api/blob?url=${encodeURIComponent(url)}`, '_blank')}
                                                    >
                                                        <img
                                                            src={`/api/blob?url=${encodeURIComponent(url)}`}
                                                            alt="Site"
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <div className="absolute inset-0 bg-indigo-600/10 opacity-0 group-hover/img:opacity-100 transition-opacity" />
                                                    </div>
                                                ))}
                                                {/* Fill empty slots */}
                                                {Array.from({ length: 4 - JSON.parse(visit.photoUrls).length }).map((_, ei) => (
                                                    <div key={`empty-${ei}`} className="aspect-square rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center opacity-40">
                                                        <div className="w-4 h-4 rounded-full border border-slate-200" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-10 glass-card p-5">
                            <p className="text-sm font-medium text-slate-500">
                                Page <span className="text-slate-900 font-bold">{page}</span> of <span className="text-slate-900 font-bold">{pagination.totalPages}</span>
                                <span className="mx-2 text-slate-200">|</span>
                                <span className="text-slate-400 font-normal">{pagination.total} entries found</span>
                            </p>
                            <div className="flex gap-2.5">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-indigo-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm group"
                                >
                                    <HiOutlineChevronLeft className="w-5 h-5 text-slate-600 group-hover:text-indigo-600" />
                                </button>
                                <button
                                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                    disabled={page === pagination.totalPages}
                                    className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-indigo-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm group"
                                >
                                    <HiOutlineChevronRight className="w-5 h-5 text-slate-600 group-hover:text-indigo-600" />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
