'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import KanbanBoard from '@/components/projects/KanbanBoard';
import { motion } from 'framer-motion';
import {
    HiOutlineFolderOpen,
    HiOutlineCloudArrowUp,
    HiOutlineDocumentText,
    HiOutlineArrowDownTray,
    HiOutlineUsers,
    HiOutlineTag,
} from 'react-icons/hi2';
import { formatDate, getStatusBadgeColor, getInitials } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function ProjectDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [tags, setTags] = useState('');
    const [dragOver, setDragOver] = useState(false);

    useEffect(() => { if (id) fetchProject(); }, [id]);

    const fetchProject = async () => {
        try {
            const res = await fetch(`/api/projects/${id}`);
            if (res.ok) {
                const data = await res.json();
                setProject(data.project);
            }
        } catch (err) { } finally { setLoading(false); }
    };

    const handleUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        setUploading(true);

        for (let i = 0; i < files.length; i++) {
            const formData = new FormData();
            formData.append('file', files[i]);
            if (tags) formData.append('tags', tags);

            try {
                const res = await fetch(`/api/projects/${id}/documents`, {
                    method: 'POST',
                    body: formData,
                });
                if (res.ok) {
                    toast.success(`Uploaded: ${files[i].name}`);
                } else {
                    const data = await res.json();
                    toast.error(data.error || 'Upload failed');
                }
            } catch (err) {
                toast.error(`Failed to upload ${files[i].name}`);
            }
        }

        setTags('');
        setUploading(false);
        fetchProject();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        handleUpload(e.dataTransfer.files);
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1048576).toFixed(1)} MB`;
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="w-10 h-10 border-3 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    if (!project) {
        return <DashboardLayout><div className="text-center py-20"><p className="text-slate-500">Project not found</p></div></DashboardLayout>;
    }

    return (
        <DashboardLayout>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                {/* Project Header */}
                <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-500/20">
                                <HiOutlineFolderOpen className="w-7 h-7 text-slate-900" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
                                <p className="text-slate-500">{project.client}</p>
                            </div>
                        </div>
                        <span className={`badge text-sm ${getStatusBadgeColor(project.status)}`}>{project.status}</span>
                    </div>
                    {project.description && <p className="text-slate-500 text-sm mb-4">{project.description}</p>}
                    <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                        <span>📅 {formatDate(project.startDate)}{project.endDate ? ` — ${formatDate(project.endDate)}` : ''}</span>
                        <span>👤 Owner: {project.owner?.name}</span>
                        {project.location && (
                            <span className="flex items-center gap-1">
                                📍 {project.location}
                                {(project.latitude && project.longitude) ? (
                                    <a href={`https://www.google.com/maps/search/?api=1&query=${project.latitude},${project.longitude}`} target="_blank" rel="noreferrer" className="text-primary-500 hover:underline ml-1 font-medium">
                                        (View on Map)
                                    </a>
                                ) : ''}
                            </span>
                        )}
                        {project.contactName && (
                            <span className="flex items-center gap-1">📞 {project.contactName} {project.contactPhone ? `— ${project.contactPhone}` : ''}</span>
                        )}
                        {project.contactEmail && (
                            <span className="flex items-center gap-1">✉️ {project.contactEmail}</span>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Team Members */}
                    <div className="glass-card p-5">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <HiOutlineUsers className="w-5 h-5 text-primary-400" />
                            Team ({project.members?.length || 0})
                        </h3>
                        <div className="space-y-3">
                            {project.members?.map((member: any) => (
                                <div key={member.id} className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center text-xs text-primary-300 font-bold">
                                        {getInitials(member.user.name)}
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-900">{member.user.name}</p>
                                        <p className="text-xs text-slate-500">{member.role}</p>
                                    </div>
                                </div>
                            ))}
                            {(!project.members || project.members.length === 0) && <p className="text-slate-500 text-sm">No team members yet</p>}
                        </div>
                    </div>

                    {/* Upload & Documents */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Upload Area */}
                        <div
                            className={`glass-card p-6 border-2 border-dashed transition-all ${dragOver ? 'border-primary-500 bg-primary-500/5' : 'border-gray-300'
                                }`}
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                        >
                            <div className="text-center">
                                <HiOutlineCloudArrowUp className={`w-10 h-10 mx-auto mb-3 ${dragOver ? 'text-primary-400' : 'text-slate-8000'}`} />
                                <p className="text-slate-500 mb-2">Drag & drop files here or click to browse</p>
                                <p className="text-xs text-slate-8000 mb-4">Supports DWG, PDF, BIM, images, and more</p>
                                <div className="flex items-center gap-3 justify-center">
                                    <input type="text" className="input-field w-48 text-sm" placeholder="Tags (comma-separated)" value={tags} onChange={(e) => setTags(e.target.value)} />
                                    <label className="btn-primary text-sm cursor-pointer">
                                        {uploading ? (
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            'Browse Files'
                                        )}
                                        <input type="file" className="hidden" multiple onChange={(e) => handleUpload(e.target.files)} disabled={uploading} />
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Documents List */}
                        <div className="glass-card overflow-hidden">
                            <div className="p-5 border-b border-gray-200/50">
                                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                    <HiOutlineDocumentText className="w-5 h-5 text-primary-400" />
                                    Documents ({project.documents?.length || 0})
                                </h3>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {project.documents?.map((doc: any) => (
                                    <div key={doc.id} className="flex items-center justify-between p-4 hover:bg-white/30 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-xs text-slate-500 font-medium">
                                                {doc.filename.split('.').pop()?.toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-900 font-medium">{doc.filename}</p>
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <span>v{doc.version}</span>
                                                    <span>•</span>
                                                    <span>{doc.size ? formatFileSize(doc.size) : '—'}</span>
                                                    <span>•</span>
                                                    <span>{doc.uploader?.name}</span>
                                                    <span>•</span>
                                                    <span>{formatDate(doc.createdAt)}</span>
                                                </div>
                                                {doc.tags && (
                                                    <div className="flex gap-1 mt-1">
                                                        {doc.tags.split(',').map((tag: string) => (
                                                            <span key={tag} className="flex items-center gap-0.5 px-1.5 py-0.5 bg-white text-slate-500 rounded text-xs">
                                                                <HiOutlineTag className="w-2.5 h-2.5" />{tag.trim()}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <a href={doc.storagePath} download className="p-2 text-slate-500 hover:text-primary-400 transition-colors">
                                            <HiOutlineArrowDownTray className="w-5 h-5" />
                                        </a>
                                    </div>
                                ))}
                                {(!project.documents || project.documents.length === 0) && (
                                    <p className="text-center text-slate-500 py-8">No documents uploaded yet</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Milestone Kanban Board */}
                <div className="glass-card p-6 mt-6">
                    <KanbanBoard projectId={id} />
                </div>
            </motion.div>
        </DashboardLayout>
    );
}
