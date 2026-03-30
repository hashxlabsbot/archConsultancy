'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
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
    HiOutlinePlus,
    HiOutlineTrash,
    HiXMark,
    HiOutlineEye,
} from 'react-icons/hi2';
import { formatDate, getStatusBadgeColor, getInitials } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function ProjectDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const { data: session } = useSession();
    const [project, setProject] = useState<any>(null);
    const role = (session?.user as any)?.role;
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [tags, setTags] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [eligibleUsers, setEligibleUsers] = useState<any[]>([]);
    const [loadingEligibleUsers, setLoadingEligibleUsers] = useState(false);
    const [addingMember, setAddingMember] = useState(false);
    const [previewDoc, setPreviewDoc] = useState<any>(null);

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

    const fetchEligibleUsers = async () => {
        setLoadingEligibleUsers(true);
        try {
            const res = await fetch(`/api/projects/${id}/members`);
            if (res.ok) {
                const data = await res.json();
                setEligibleUsers(data.users || []);
            }
        } catch (e) { } finally { setLoadingEligibleUsers(false); }
    };

    const handleAddMember = async (userId: string) => {
        setAddingMember(true);
        try {
            const res = await fetch(`/api/projects/${id}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, role: 'MEMBER' })
            });
            if (res.ok) {
                toast.success('Member added');
                fetchProject();
                fetchEligibleUsers();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to add member');
            }
        } catch (err) { toast.error('Error adding member'); }
        finally { setAddingMember(false); }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!confirm('Remove this member?')) return;
        try {
            const res = await fetch(`/api/projects/${id}/members/${userId}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Member removed');
                fetchProject();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to remove member');
            }
        } catch (e) { toast.error('Error removing member'); }
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
                        <div className="flex items-center gap-3">
                            {(role === 'ADMIN' || role === 'SENIOR') && (
                                <button
                                    onClick={async () => {
                                        const newStatus = (project.status === 'RUNNING' || project.status === 'ACTIVE') ? 'COMPLETED' : 'RUNNING';
                                        try {
                                            const res = await fetch(`/api/projects/${id}`, {
                                                method: 'PATCH',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ status: newStatus }),
                                            });
                                            if (res.ok) {
                                                toast.success(`Project marked as ${newStatus.toLowerCase()}`);
                                                fetchProject();
                                            }
                                        } catch (e) { toast.error('Failed to update status'); }
                                    }}
                                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border shadow-sm ${(project.status === 'RUNNING' || project.status === 'ACTIVE')
                                        ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                        }`}
                                >
                                    {(project.status === 'RUNNING' || project.status === 'ACTIVE') ? 'Mark as Completed' : 'Mark as Running'}
                                </button>
                            )}
                            <span className={`badge text-sm ${getStatusBadgeColor(project.status)}`}>
                                {project.status === 'ACTIVE' || project.status === 'RUNNING' ? 'Running' : 'Completed'}
                            </span>
                        </div>
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
                        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <HiOutlineUsers className="w-5 h-5 text-primary-400" />
                                Team ({project.members?.length || 0})
                            </div>
                            <button onClick={() => { setShowAddMemberModal(true); fetchEligibleUsers(); }} className="btn-primary py-1 px-2 text-xs flex items-center gap-1">
                                <HiOutlinePlus className="w-3 h-3" /> Add
                            </button>
                        </h3>
                        <div className="space-y-3">
                            {project.members?.map((member: any) => (
                                <div key={member.id} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center text-xs text-primary-300 font-bold">
                                            {getInitials(member.user.name)}
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-900">{member.user.name}</p>
                                            <p className="text-xs text-slate-500">{member.role}</p>
                                        </div>
                                    </div>
                                    {member.user.id !== project.ownerId && (
                                        <button onClick={() => handleRemoveMember(member.user.id)} className="text-slate-300 hover:text-danger-500 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                                            <HiOutlineTrash className="w-4 h-4" />
                                        </button>
                                    )}
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
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => setPreviewDoc(doc)} className="p-2 text-slate-500 hover:text-indigo-600 transition-colors" title="Preview File">
                                                <HiOutlineEye className="w-5 h-5" />
                                            </button>
                                            <a href={doc.storagePath} download className="p-2 text-slate-500 hover:text-primary-400 transition-colors" title="Download File">
                                                <HiOutlineArrowDownTray className="w-5 h-5" />
                                            </a>
                                        </div>
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
                    <KanbanBoard projectId={id} members={project.members || []} />
                </div>

                {/* Add Member Modal */}
                {showAddMemberModal && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-50 text-slate-900 font-bold">
                                Add Team Member
                                <button onClick={() => setShowAddMemberModal(false)}><HiXMark className="w-5 h-5 text-slate-400" /></button>
                            </div>
                            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
                                {loadingEligibleUsers ? (
                                    <div className="flex justify-center p-6"><div className="w-6 h-6 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" /></div>
                                ) : eligibleUsers.length === 0 ? (
                                    <p className="text-sm text-slate-500 text-center py-4">No eligible users found.</p>
                                ) : (
                                    eligibleUsers.map(user => (
                                        <div key={user.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center text-xs text-primary-500 font-bold">
                                                    {getInitials(user.name)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900">{user.name}</p>
                                                    <p className="text-xs text-slate-500">{user.email}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => handleAddMember(user.id)} disabled={addingMember} className="btn-secondary text-xs py-1 px-3">
                                                Add
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
                {/* Document Preview Modal */}
                {previewDoc && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="bg-white rounded-2xl w-full max-w-5xl h-[85vh] overflow-hidden shadow-2xl flex flex-col">
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-50">
                                <div>
                                    <h3 className="font-bold text-slate-900 flex items-center gap-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
                                        <HiOutlineDocumentText className="w-5 h-5 text-indigo-500" />
                                        {previewDoc.filename}
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5 ml-7">Uploaded by {previewDoc.uploader?.name} • {formatFileSize(previewDoc.size || 0)}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <a href={previewDoc.storagePath} download className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5">
                                        <HiOutlineArrowDownTray className="w-3.5 h-3.5" /> Download
                                    </a>
                                    <button onClick={() => setPreviewDoc(null)} className="p-1.5 text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 rounded-lg transition-colors border border-gray-200">
                                        <HiXMark className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 bg-slate-100/50 p-4 overflow-hidden relative flex items-center justify-center">
                                {(() => {
                                    const ext = previewDoc.filename.split('.').pop()?.toLowerCase() || '';
                                    const url = previewDoc.storagePath;

                                    // Images
                                    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
                                        return <img src={url} alt={previewDoc.filename} className="max-w-full max-h-full object-contain rounded-lg shadow-sm" />;
                                    }
                                    // PDFs
                                    if (ext === 'pdf') {
                                        return <iframe src={url} className="w-full h-full rounded-lg bg-white shadow-sm border border-gray-200" title={previewDoc.filename} />;
                                    }
                                    // Office Files (Requires public URL, fallback mechanism)
                                    if (['docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt'].includes(ext)) {
                                        const officeUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
                                        return (
                                            <div className="w-full h-full flex flex-col">
                                                <div className="bg-amber-50 text-amber-800 text-xs p-2 text-center border-b border-amber-200">
                                                    Note: Office Preview requires the file to be publicly accessible. If it fails to load, please use the download button.
                                                </div>
                                                <iframe src={officeUrl} className="w-full flex-1 bg-white" title={previewDoc.filename} />
                                            </div>
                                        );
                                    }
                                    // CAD Files
                                    if (['dwg', 'dxf', 'step', 'stp', 'iges', 'igs', 'plt', 'hpgl', 'step'].includes(ext)) {
                                        // Use ShareCAD free iframe viewer (Requires public URL)
                                        const cadUrl = `https://sharecad.org/cadframe/load?url=${encodeURIComponent(url)}`;
                                        return (
                                            <div className="w-full h-full flex flex-col">
                                                <div className="bg-sky-50 text-sky-800 text-xs p-2 text-center border-b border-sky-200">
                                                    Note: CAD Preview via ShareCAD requires the file to be publicly accessible on the internet.
                                                </div>
                                                <iframe src={cadUrl} className="w-full flex-1 bg-white" title={previewDoc.filename} />
                                            </div>
                                        );
                                    }

                                    // Others (No native preview)
                                    return (
                                        <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-sm w-full">
                                            <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
                                                <span className="text-lg font-bold uppercase">{ext}</span>
                                            </div>
                                            <h4 className="text-slate-900 font-bold mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>Preview Not Supported</h4>
                                            <p className="text-slate-500 text-sm mb-6">
                                                Your browser cannot natively render .{ext} files. Please download the file to view it in your local application (e.g., AutoCAD, Revit).
                                            </p>
                                            <a href={url} download className="btn-primary w-full flex items-center justify-center gap-2">
                                                <HiOutlineArrowDownTray className="w-4 h-4" /> Download File
                                            </a>
                                        </div>
                                    );
                                })()}
                            </div>
                        </motion.div>
                    </div>
                )}
            </motion.div>
        </DashboardLayout>
    );
}
