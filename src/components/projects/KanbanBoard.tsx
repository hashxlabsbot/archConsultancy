'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HiOutlinePlus, HiOutlineCalendar, HiOutlineTrash, HiXMark,
    HiOutlineChatBubbleLeftRight, HiOutlinePaperClip, HiOutlineArrowDownTray,
    HiOutlineCheckCircle, HiOutlineDocumentText, HiOutlinePaperAirplane,
    HiOutlineEye,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils';

const COLUMNS = [
    { id: 'TODO', label: 'To Do', color: 'border-slate-200 bg-slate-50', head: 'bg-slate-100 text-slate-600' },
    { id: 'IN_PROGRESS', label: 'In Progress', color: 'border-blue-200 bg-blue-50/60', head: 'bg-blue-100 text-blue-700' },
    { id: 'DONE', label: 'Done', color: 'border-emerald-200 bg-emerald-50/60', head: 'bg-emerald-100 text-emerald-700' },
];

function getInitials(name: string) {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
}

function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

export default function KanbanBoard({ projectId, members, onPreview }: { projectId: string; members: any[]; onPreview?: (doc: any) => void }) {
    const { data: session } = useSession();
    const [milestones, setMilestones] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [draggedItem, setDraggedItem] = useState<any>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newMilestone, setNewMilestone] = useState({ title: '', description: '', dueDate: '', assigneeId: '' });

    // Card detail / comment state
    const [selectedCard, setSelectedCard] = useState<any>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);
    const [uploadingDeliverable, setUploadingDeliverable] = useState(false);
    const commentEndRef = useRef<HTMLDivElement>(null);
    const deliverableInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { fetchMilestones(); }, [projectId]);

    const fetchMilestones = async () => {
        try {
            const res = await fetch(`/api/projects/${projectId}/milestones`);
            if (res.ok) {
                const data = await res.json();
                setMilestones(data.milestones || []);
            }
        } catch (e) { } finally { setLoading(false); }
    };

    // ── Fetch comments when a card is selected ──────────────────────────────
    useEffect(() => {
        if (!selectedCard) { setComments([]); return; }
        fetchComments(selectedCard.id);
    }, [selectedCard?.id]);

    useEffect(() => {
        commentEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [comments]);

    const fetchComments = async (milestoneId: string) => {
        setCommentsLoading(true);
        try {
            const res = await fetch(`/api/projects/${projectId}/milestones/${milestoneId}/comments`);
            if (res.ok) setComments((await res.json()).comments || []);
        } catch { } finally { setCommentsLoading(false); }
    };

    const handleAddComment = async () => {
        if (!commentText.trim() || !selectedCard) return;
        setSubmittingComment(true);
        try {
            const res = await fetch(`/api/projects/${projectId}/milestones/${selectedCard.id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: commentText }),
            });
            if (res.ok) {
                const { comment } = await res.json();
                setComments(prev => [...prev, comment]);
                setCommentText('');
                // update comment count on card
                setMilestones(prev => prev.map(m =>
                    m.id === selectedCard.id ? { ...m, _count: { comments: (m._count?.comments || 0) + 1 } } : m
                ));
            } else { toast.error('Failed to post comment'); }
        } catch { toast.error('Error posting comment'); }
        finally { setSubmittingComment(false); }
    };

    // ── Deliverable upload (DONE column only) ───────────────────────────────
    const handleDeliverableUpload = async (file: File) => {
        if (!selectedCard) return;
        setUploadingDeliverable(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            fd.append('folder', 'milestones/deliverables');
            const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd });
            if (!uploadRes.ok) {
                const errorData = await uploadRes.json().catch(() => ({}));
                throw new Error(errorData.error || 'Upload failed');
            }
            const { url } = await uploadRes.json();

            const patchRes = await fetch(`/api/projects/${projectId}/milestones/${selectedCard.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deliverableUrl: url, deliverableType: file.type, deliverableName: file.name }),
            });
            if (!patchRes.ok) {
                const errorData = await patchRes.json().catch(() => ({}));
                throw new Error(errorData.error || 'Save failed');
            }
            const { milestone } = await patchRes.json();
            setSelectedCard((prev: any) => ({ ...prev, ...milestone }));
            setMilestones(prev => prev.map(m => m.id === milestone.id ? { ...m, ...milestone } : m));
            toast.success('Deliverable uploaded');
        } catch (e: any) {
            toast.error(e.message || 'Upload failed');
        } finally {
            setUploadingDeliverable(false);
            if (deliverableInputRef.current) deliverableInputRef.current.value = '';
        }
    };

    // ── Drag & Drop ─────────────────────────────────────────────────────────
    const handleDragStart = (e: React.DragEvent, item: any) => {
        setDraggedItem(item);
        e.dataTransfer.effectAllowed = 'move';
        const img = new Image();
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        e.dataTransfer.setDragImage(img, 0, 0);
    };

    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };

    const handleDrop = async (e: React.DragEvent, status: string) => {
        e.preventDefault();
        if (!draggedItem || draggedItem.status === status) { setDraggedItem(null); return; }
        const previous = [...milestones];
        setMilestones(prev => prev.map(m => m.id === draggedItem.id ? { ...m, status } : m));
        try {
            const res = await fetch(`/api/projects/${projectId}/milestones/${draggedItem.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            if (!res.ok) throw new Error('Failed');
        } catch {
            setMilestones(previous);
            toast.error('Failed to move milestone');
        } finally { setDraggedItem(null); }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`/api/projects/${projectId}/milestones`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newMilestone),
            });
            if (res.ok) {
                toast.success('Milestone added');
                setShowAddModal(false);
                setNewMilestone({ title: '', description: '', dueDate: '', assigneeId: '' });
                fetchMilestones();
            } else { toast.error('Failed to add'); }
        } catch { toast.error('Error adding milestone'); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this milestone?')) return;
        try {
            const res = await fetch(`/api/projects/${projectId}/milestones/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Deleted');
                setMilestones(prev => prev.filter(m => m.id !== id));
                if (selectedCard?.id === id) setSelectedCard(null);
            }
        } catch { }
    };

    if (loading) return <div className="animate-pulse h-64 bg-slate-100 rounded-2xl w-full" />;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Project Milestones</h3>
                <button onClick={() => setShowAddModal(true)} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
                    <HiOutlinePlus className="w-4 h-4" /> Add
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {COLUMNS.map(col => (
                    <div
                        key={col.id}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, col.id)}
                        className={`min-h-[400px] rounded-2xl border-2 border-dashed ${col.color} p-3 flex flex-col gap-3 transition-colors`}
                    >
                        <div className={`flex items-center justify-between px-2 py-1.5 rounded-xl ${col.head}`}>
                            <h4 className="font-bold uppercase tracking-wider text-xs">
                                {col.label}
                            </h4>
                            <span className="text-xs font-bold opacity-60">
                                {milestones.filter(m => m.status === col.id).length}
                            </span>
                        </div>

                        {milestones.filter(m => m.status === col.id).map(m => (
                            <motion.div
                                layoutId={m.id}
                                key={m.id}
                                draggable
                                onDragStart={(e: any) => handleDragStart(e, m)}
                                onClick={() => setSelectedCard(m)}
                                className={`bg-white p-3 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-slate-200 transition-all relative group ${draggedItem?.id === m.id ? 'opacity-50 scale-95' : ''}`}
                            >
                                <button
                                    onClick={e => { e.stopPropagation(); handleDelete(m.id); }}
                                    className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                >
                                    <HiOutlineTrash className="w-3.5 h-3.5" />
                                </button>

                                <h5 className="font-bold text-slate-900 text-sm pr-6 leading-tight mb-1">{m.title}</h5>
                                {m.description && <p className="text-xs text-slate-500 mb-2 line-clamp-2">{m.description}</p>}

                                {m.dueDate && (
                                    <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-400 mt-1 bg-slate-50 w-fit px-2 py-0.5 rounded-md">
                                        <HiOutlineCalendar className="w-3 h-3" />
                                        {formatDate(m.dueDate)}
                                    </div>
                                )}

                                {m.assignee && (
                                    <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col gap-1">
                                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                                            <span className="font-medium">Assignee</span>
                                            <span className="font-semibold text-slate-700 truncate max-w-[80px]">{m.assignee.name}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Footer: comment count + deliverable indicator */}
                                <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center gap-3">
                                    <span className="flex items-center gap-1 text-[10px] text-slate-400">
                                        <HiOutlineChatBubbleLeftRight className="w-3 h-3" />
                                        {m._count?.comments || 0}
                                    </span>
                                    {m.deliverableUrl && (
                                        <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                                            <HiOutlineCheckCircle className="w-3 h-3" /> Deliverable
                                        </span>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ))}
            </div>

            {/* ── Card Detail / Comment Modal ─────────────────────────────── */}
            <AnimatePresence>
                {selectedCard && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setSelectedCard(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.97, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.97 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
                        >
                            {/* Header */}
                            <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${selectedCard.status === 'DONE' ? 'bg-emerald-100 text-emerald-700' :
                                            selectedCard.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                                                'bg-slate-100 text-slate-600'
                                            }`}>
                                            {COLUMNS.find(c => c.id === selectedCard.status)?.label}
                                        </span>
                                    </div>
                                    <h2 className="text-lg font-bold text-slate-900 leading-tight">{selectedCard.title}</h2>
                                    {selectedCard.description && <p className="text-sm text-slate-500 mt-1">{selectedCard.description}</p>}
                                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
                                        {selectedCard.dueDate && (
                                            <span className="flex items-center gap-1">
                                                <HiOutlineCalendar className="w-3.5 h-3.5" /> {formatDate(selectedCard.dueDate)}
                                            </span>
                                        )}
                                        {selectedCard.assignee && <span>Assignee: <strong>{selectedCard.assignee.name}</strong></span>}
                                    </div>
                                </div>
                                <button onClick={() => setSelectedCard(null)} className="text-slate-400 hover:text-slate-700 flex-shrink-0">
                                    <HiXMark className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Deliverable section — Shown if exists OR if status is DONE */}
                            {(selectedCard.status === 'DONE' || selectedCard.deliverableUrl) && (
                                <div className="px-5 py-3 bg-emerald-50 border-b border-emerald-100">
                                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">Final Deliverable / Milestone Attachment</p>
                                    {selectedCard.deliverableUrl ? (
                                        <div className="flex items-center gap-2">
                                            <HiOutlineDocumentText className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-800 truncate">{selectedCard.deliverableName || 'Attachment'}</p>
                                                <p className="text-[10px] text-slate-500 uppercase">{selectedCard.deliverableType?.split('/')[1] || 'File'}</p>
                                            </div>
                                            <div className="flex items-center gap-1.5 overflow-x-auto">
                                                <button
                                                    onClick={() => onPreview && onPreview({
                                                        filename: selectedCard.deliverableName || 'Deliverable',
                                                        storagePath: `/api/blob?url=${encodeURIComponent(selectedCard.deliverableUrl)}`,
                                                        size: 0,
                                                        uploader: { name: selectedCard.assignee?.name || 'Assignee' },
                                                        createdAt: selectedCard.updatedAt
                                                    })}
                                                    className="flex items-center gap-1 px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors whitespace-nowrap"
                                                >
                                                    <HiOutlineEye className="w-4 h-4" /> Preview & Download
                                                </button>

                                                {((session?.user as any)?.role === 'ADMIN' || (session?.user as any)?.role === 'SENIOR' || selectedCard.status === 'DONE') && (
                                                    <label className="flex items-center gap-1 px-3 py-2 bg-white border border-emerald-300 text-emerald-700 rounded-lg text-xs font-bold cursor-pointer hover:bg-emerald-50 transition-colors whitespace-nowrap shadow-sm">
                                                        {uploadingDeliverable ? <div className="w-4 h-4 border-2 border-emerald-400/40 border-t-emerald-600 rounded-full animate-spin" /> : <HiOutlinePaperClip className="w-4 h-4" />}
                                                        {selectedCard.deliverableUrl ? 'Replace' : 'Attach File'}
                                                        <input ref={deliverableInputRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.dwg,.zip" onChange={e => e.target.files?.[0] && handleDeliverableUpload(e.target.files[0])} disabled={uploadingDeliverable} />
                                                    </label>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        selectedCard.status === 'DONE' && (
                                            <label className="flex items-center gap-2 w-fit px-4 py-2 bg-white border-2 border-dashed border-emerald-300 text-emerald-700 rounded-xl text-sm font-bold cursor-pointer hover:bg-emerald-50 transition-colors">
                                                {uploadingDeliverable
                                                    ? <><div className="w-4 h-4 border-2 border-emerald-400/40 border-t-emerald-600 rounded-full animate-spin" /> Uploading...</>
                                                    : <><HiOutlinePaperClip className="w-4 h-4" /> Attach Final Document / PDF / Image</>
                                                }
                                                <input ref={deliverableInputRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.dwg,.zip" onChange={e => e.target.files?.[0] && handleDeliverableUpload(e.target.files[0])} disabled={uploadingDeliverable} />
                                            </label>
                                        )
                                    )}
                                </div>
                            )}

                            {/* Comments Thread */}
                            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-[180px]">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <HiOutlineChatBubbleLeftRight className="w-3.5 h-3.5" />
                                    Conversation ({comments.length})
                                </p>
                                {commentsLoading ? (
                                    <div className="flex justify-center py-8">
                                        <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin" />
                                    </div>
                                ) : comments.length === 0 ? (
                                    <p className="text-sm text-slate-400 text-center py-6">No comments yet. Be the first to add context.</p>
                                ) : (
                                    comments.map(c => (
                                        <div key={c.id} className="flex gap-3">
                                            <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                                                {getInitials(c.user.name)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-baseline gap-2 mb-0.5">
                                                    <span className="text-xs font-bold text-slate-800">{c.user.name}</span>
                                                    {c.user.designation && <span className="text-[10px] text-slate-400">{c.user.designation}</span>}
                                                    <span className="text-[10px] text-slate-400 ml-auto">{timeAgo(c.createdAt)}</span>
                                                </div>
                                                <div className="bg-slate-50 rounded-xl rounded-tl-sm px-3 py-2 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                                    {c.content}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                                <div ref={commentEndRef} />
                            </div>

                            {/* Comment Input */}
                            <div className="p-4 border-t border-slate-100 bg-slate-50/60">
                                <div className="flex items-end gap-3">
                                    <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                                        {getInitials((session?.user as any)?.name || '?')}
                                    </div>
                                    <textarea
                                        value={commentText}
                                        onChange={e => setCommentText(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
                                        placeholder={`Add a comment… (Enter to send, Shift+Enter for new line)`}
                                        rows={2}
                                        className="flex-1 resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition"
                                    />
                                    <button
                                        onClick={handleAddComment}
                                        disabled={!commentText.trim() || submittingComment}
                                        className="p-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 disabled:opacity-40 transition-colors flex-shrink-0"
                                    >
                                        {submittingComment
                                            ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                            : <HiOutlinePaperAirplane className="w-4 h-4" />
                                        }
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Add Milestone Modal ─────────────────────────────────────── */}
            {showAddModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-50 text-slate-900 font-bold">
                            Add Milestone
                            <button onClick={() => setShowAddModal(false)}><HiXMark className="w-5 h-5 text-slate-400" /></button>
                        </div>
                        <form onSubmit={handleAdd} className="p-5 space-y-4">
                            <div>
                                <label className="input-label">Title</label>
                                <input type="text" required className="input-field" value={newMilestone.title} onChange={e => setNewMilestone({ ...newMilestone, title: e.target.value })} placeholder="e.g. Schematic Design Phase" />
                            </div>
                            <div>
                                <label className="input-label">Description (Optional)</label>
                                <textarea className="input-field min-h-[80px]" value={newMilestone.description} onChange={e => setNewMilestone({ ...newMilestone, description: e.target.value })} />
                            </div>
                            <div>
                                <label className="input-label">Due Date (Optional)</label>
                                <input type="date" className="input-field" value={newMilestone.dueDate} onChange={e => setNewMilestone({ ...newMilestone, dueDate: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                <div>
                                    <label className="input-label">Assignee</label>
                                    <select className="input-field" value={newMilestone.assigneeId} onChange={e => setNewMilestone({ ...newMilestone, assigneeId: e.target.value })}>
                                        <option value="">Unassigned</option>
                                        {members?.map((m: any) => (
                                            <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end pt-2">
                                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary mr-2">Cancel</button>
                                <button type="submit" className="btn-primary">Add Milestone</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
