'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiOutlinePlus, HiOutlineCalendar, HiOutlineTrash, HiXMark } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils';

const COLUMNS = [
    { id: 'TODO', label: 'To Do', color: 'border-slate-200 bg-slate-50' },
    { id: 'IN_PROGRESS', label: 'In Progress', color: 'border-primary-200 bg-primary-50' },
    { id: 'REVIEW', label: 'Review', color: 'border-warning-200 bg-warning-50' },
    { id: 'DONE', label: 'Done', color: 'border-success-200 bg-success-50' },
];

export default function KanbanBoard({ projectId }: { projectId: string }) {
    const [milestones, setMilestones] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [draggedItem, setDraggedItem] = useState<any>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newMilestone, setNewMilestone] = useState({ title: '', description: '', dueDate: '' });

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

    const handleDragStart = (e: React.DragEvent, item: any) => {
        setDraggedItem(item);
        e.dataTransfer.effectAllowed = 'move';
        // Transparent drag image
        const img = new Image();
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        e.dataTransfer.setDragImage(img, 0, 0);
    };

    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };

    const handleDrop = async (e: React.DragEvent, status: string) => {
        e.preventDefault();
        if (!draggedItem || draggedItem.status === status) {
            setDraggedItem(null);
            return;
        }

        // Optimistic update
        const previous = [...milestones];
        setMilestones(prev => prev.map(m => m.id === draggedItem.id ? { ...m, status } : m));

        try {
            const res = await fetch(`/api/projects/${projectId}/milestones/${draggedItem.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (!res.ok) throw new Error('Failed');
        } catch (err) {
            setMilestones(previous);
            toast.error('Failed to move milestone');
        } finally {
            setDraggedItem(null);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`/api/projects/${projectId}/milestones`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newMilestone)
            });
            if (res.ok) {
                toast.success('Milestone added');
                setShowAddModal(false);
                setNewMilestone({ title: '', description: '', dueDate: '' });
                fetchMilestones();
            } else { toast.error('Failed to add'); }
        } catch (err) { toast.error('Error adding milestone'); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this milestone?')) return;
        try {
            const res = await fetch(`/api/projects/${projectId}/milestones/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Deleted');
                setMilestones(prev => prev.filter(m => m.id !== id));
            }
        } catch (e) { }
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

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 overflow-x-auto pb-4">
                {COLUMNS.map(col => (
                    <div
                        key={col.id}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, col.id)}
                        className={`min-h-[400px] rounded-2xl border-2 border-dashed ${col.color} p-3 flex flex-col gap-3 transition-colors`}
                    >
                        <h4 className="font-bold text-slate-700 uppercase tracking-wider text-xs px-1">
                            {col.label} <span className="text-slate-400 font-normal">({milestones.filter(m => m.status === col.id).length})</span>
                        </h4>

                        {milestones.filter(m => m.status === col.id).map(m => (
                            <motion.div
                                layoutId={m.id}
                                key={m.id}
                                draggable
                                onDragStart={(e: any) => handleDragStart(e, m)}
                                className={`bg-white p-3 rounded-xl shadow-sm border border-gray-100 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow relative group ${draggedItem?.id === m.id ? 'opacity-50 scale-95' : ''}`}
                            >
                                <button onClick={() => handleDelete(m.id)} className="absolute top-2 right-2 text-slate-300 hover:text-danger-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <HiOutlineTrash className="w-4 h-4" />
                                </button>
                                <h5 className="font-bold text-slate-900 text-sm pr-6 leading-tight mb-1">{m.title}</h5>
                                {m.description && <p className="text-xs text-slate-500 mb-2 line-clamp-2">{m.description}</p>}
                                {m.dueDate && (
                                    <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-400 mt-2 bg-slate-50 w-fit px-2 py-1 rounded-md">
                                        <HiOutlineCalendar className="w-3 h-3" />
                                        {formatDate(m.dueDate)}
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                ))}
            </div>

            {/* Add Modal */}
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
