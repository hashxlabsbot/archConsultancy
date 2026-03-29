'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { HiOutlineMapPin, HiPlus, HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi2';

export default function SiteVisitsPage() {
    const { data: session } = useSession();
    const [visits, setVisits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

    useEffect(() => {
        fetchVisits(page);
    }, [page]);

    const fetchVisits = async (p: number) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/site-visits?page=${p}&limit=20`);
            if (res.ok) {
                const data = await res.json();
                setVisits(data.visits || []);
                if (data.pagination) setPagination(data.pagination);
            }
        } catch (e) { } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Site Visits</h1>
                    <p className="text-slate-500 text-sm">Field reports and location tracking.</p>
                </div>
                <Link href="/site-visits/new" className="btn-primary flex items-center gap-2">
                    <HiPlus className="w-5 h-5 text-white/70" />
                    Log Visit
                </Link>
            </div>

            {loading ? (
                <div className="text-center py-12 text-slate-500">Loading site visits...</div>
            ) : visits.length === 0 ? (
                <div className="glass-card p-12 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <HiOutlineMapPin className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">No Site Visits</h3>
                    <p className="text-slate-500 text-sm mb-4">You haven't logged any field reports yet.</p>
                    <Link href="/site-visits/new" className="btn-primary inline-flex">Log First Visit</Link>
                </div>
            ) : (
                <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {visits.map((visit, i) => (
                        <motion.div
                            key={visit.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className="glass-card p-5 hover:shadow-xl transition-all flex flex-col"
                        >
                            <div className="flex justify-between items-start mb-3 border-b border-gray-100 pb-3">
                                <div>
                                    <h3 className="font-bold text-slate-900">{visit.project?.name}</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">{new Date(visit.date).toLocaleDateString()} by {visit.user?.name}</p>
                                </div>
                                <span className={`badge ${visit.status === 'PENDING' ? 'bg-warning-50 text-warning-700 border-warning-200' : 'bg-success-50 text-success-700 border-success-200'}`}>
                                    {visit.status}
                                </span>
                            </div>

                            {(visit.latitude || visit.address) && (
                                <div className="text-xs text-slate-600 flex items-start gap-1.5 mb-3 bg-slate-50 p-2.5 rounded-xl border border-gray-100">
                                    <HiOutlineMapPin className="w-4 h-4 text-primary-500 shrink-0 mt-0.5" />
                                    <div>
                                        {visit.address ? <div className="font-medium">{visit.address}</div> : null}
                                        {visit.latitude && visit.longitude && (
                                            <div className="text-[10px] text-slate-400 font-mono tracking-tight mt-0.5">
                                                Lat {visit.latitude.toFixed(5)}, Lng {visit.longitude.toFixed(5)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <p className="text-sm text-slate-700 mb-4 flex-1 whitespace-pre-wrap">{visit.notes}</p>

                            {visit.photoUrls && JSON.parse(visit.photoUrls).length > 0 && (
                                <div className="flex gap-2.5 overflow-x-auto pb-1 mt-auto">
                                    {JSON.parse(visit.photoUrls).map((url: string, i: number) => (
                                        <div key={i} className="w-16 h-16 shrink-0 rounded-xl overflow-hidden border border-gray-200 shadow-sm cursor-pointer hover:border-primary-400 transition-colors">
                                            <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 glass-card p-4">
                        <p className="text-sm text-slate-500">
                            Page {page} of {pagination.totalPages} · {pagination.total} total
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 rounded-lg border border-gray-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <HiOutlineChevronLeft className="w-4 h-4 text-slate-600" />
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                disabled={page === pagination.totalPages}
                                className="p-2 rounded-lg border border-gray-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <HiOutlineChevronRight className="w-4 h-4 text-slate-600" />
                            </button>
                        </div>
                    </div>
                )}
                </>
            )}
        </div>
    );
}
