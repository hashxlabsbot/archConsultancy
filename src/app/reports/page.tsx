'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { HiOutlineDocumentText, HiOutlinePlus, HiOutlineChatBubbleLeft } from 'react-icons/hi2';
import { formatDate, formatTime } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function ReportsPage() {
    const { data: session } = useSession();
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [commentModal, setCommentModal] = useState<{ id: string; open: boolean; comment: string }>({ id: '', open: false, comment: '' });
    const role = (session?.user as any)?.role;

    useEffect(() => { fetchReports(); }, []);

    const fetchReports = async () => {
        try {
            const res = await fetch('/api/reports');
            if (res.ok) {
                const data = await res.json();
                setReports(data.reports);
            }
        } catch (err) { } finally { setLoading(false); }
    };

    const submitComment = async () => {
        try {
            const res = await fetch(`/api/reports/${commentModal.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ managerComment: commentModal.comment }),
            });
            if (res.ok) {
                toast.success('Comment added');
                setCommentModal({ id: '', open: false, comment: '' });
                fetchReports();
            }
        } catch (err) { toast.error('Failed to add comment'); }
    };

    return (
        <DashboardLayout>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Daily Reports</h1>
                        <p className="text-slate-500 mt-1">{(role !== 'ADMIN' && role !== 'SENIOR') ? 'Your submitted reports' : 'All team reports'}</p>
                    </div>
                    <Link href="/reports/new" className="btn-primary flex items-center gap-2">
                        <HiOutlinePlus className="w-4 h-4" /> New Report
                    </Link>
                </div>

                <div className="space-y-4">
                    {reports.map((report) => (
                        <motion.div key={report.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center">
                                        <HiOutlineDocumentText className="w-4 h-4 text-primary-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">{report.user?.name}</p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs text-slate-500">{formatDate(report.submittedAt)} at {formatTime(report.submittedAt)}</p>
                                            {report.project && (
                                                <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-primary-50 text-primary-600 border border-primary-100">
                                                    {report.project.name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {(role === 'SENIOR' || role === 'ADMIN') && (
                                    <button
                                        onClick={() => setCommentModal({ id: report.id, open: true, comment: report.managerComment || '' })}
                                        className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
                                    >
                                        <HiOutlineChatBubbleLeft className="w-3.5 h-3.5" />
                                        {report.managerComment ? 'Edit Comment' : 'Add Comment'}
                                    </button>
                                )}
                            </div>

                            <div className="space-y-3">
                                <div><p className="text-xs text-slate-500 font-medium mb-1">Tasks Completed</p><p className="text-sm text-slate-600 whitespace-pre-line">{report.tasks}</p></div>
                                {report.blockers && <div><p className="text-xs text-slate-500 font-medium mb-1">Blockers</p><p className="text-sm text-warning-300 whitespace-pre-line">{report.blockers}</p></div>}
                                {report.nextPlan && <div><p className="text-xs text-slate-500 font-medium mb-1">Plan for Tomorrow</p><p className="text-sm text-slate-600 whitespace-pre-line">{report.nextPlan}</p></div>}
                                {report.imageUrl && (
                                    <div>
                                        <p className="text-xs text-slate-500 font-medium mb-2">Attached Image</p>
                                        <img src={report.imageUrl} alt="Attached to report" className="w-full max-w-sm rounded-xl border border-slate-200 object-cover" />
                                    </div>
                                )}
                                {report.managerComment && (
                                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 mt-2">
                                        <p className="text-xs text-blue-400 font-medium mb-1">Manager Comment</p>
                                        <p className="text-sm text-blue-200">{report.managerComment}</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                    {reports.length === 0 && !loading && (
                        <div className="text-center py-12">
                            <HiOutlineDocumentText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500">No reports yet</p>
                            <Link href="/reports/new" className="btn-primary mt-4 inline-block">Submit Your First Report</Link>
                        </div>
                    )}
                </div>

                {/* Comment Modal */}
                {commentModal.open && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card p-6 w-full max-w-md">
                            <h3 className="text-lg font-semibold text-slate-900 mb-4">Manager Comment</h3>
                            <textarea
                                className="input-field min-h-[100px]"
                                placeholder="Add your feedback..."
                                value={commentModal.comment}
                                onChange={(e) => setCommentModal({ ...commentModal, comment: e.target.value })}
                            />
                            <div className="flex justify-end gap-3 mt-4">
                                <button onClick={() => setCommentModal({ id: '', open: false, comment: '' })} className="btn-secondary text-sm">Cancel</button>
                                <button onClick={submitComment} className="btn-primary text-sm">Save Comment</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </motion.div>
        </DashboardLayout>
    );
}
