'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineCog6Tooth, HiOutlineUsers, HiOutlineShieldCheck, HiPencil, HiTrash, HiXMark } from 'react-icons/hi2';
import { getInitials, getRoleBadgeColor } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function AdminPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);

    // User Modal State
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', role: 'EMPLOYEE', phone: '', skills: '',
        designation: '', fathersName: '', joiningDate: '', panCard: '', aadharNo: ''
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            const res = await fetch('/api/users');
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users);
            }
        } catch (err) { } finally { setLoadingUsers(false); }
    };

    const openAddModal = () => {
        setFormData({
            name: '', email: '', password: '', role: 'EMPLOYEE', phone: '', skills: '',
            designation: '', fathersName: '', joiningDate: '', panCard: '', aadharNo: ''
        });
        setModalMode('add');
        setIsUserModalOpen(true);
    };

    const openEditModal = (user: any) => {
        setSelectedUser(user);
        setFormData({
            name: user.name, email: user.email, password: '', role: user.role,
            phone: user.phone || '', skills: user.skills || '',
            designation: user.designation || '', fathersName: user.fathersName || '',
            joiningDate: user.joiningDate ? new Date(user.joiningDate).toISOString().split('T')[0] : '',
            panCard: user.panCard || '', aadharNo: user.aadharNo || ''
        });
        setModalMode('edit');
        setIsUserModalOpen(true);
    };

    const handleUserSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (modalMode === 'add') {
                const res = await fetch('/api/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                if (!res.ok) {
                    const errorJson = await res.json();
                    throw new Error(errorJson.error || 'Failed to create user');
                }
                toast.success('User created successfully');
            } else {
                const res = await fetch(`/api/users/${selectedUser.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                if (!res.ok) {
                    const errorJson = await res.json();
                    throw new Error(errorJson.error || 'Failed to update user');
                }
                toast.success('User updated successfully');
            }
            setIsUserModalOpen(false);
            fetchUsers();
        } catch (err: any) {
            toast.error(err.message || 'Action failed');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        try {
            const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const errorJson = await res.json();
                throw new Error(errorJson.error || 'Failed to delete user');
            }
            toast.success('User deleted');
            fetchUsers();
        } catch (err: any) {
            toast.error(err.message || 'Delete failed');
        }
    };

    return (
        <DashboardLayout>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Admin Settings</h1>
                    <p className="text-slate-500 mt-1">Manage users, roles, and review organization-wide attendance & reports</p>
                </div>

                <div className="space-y-6">
                    {/* Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="glass-card p-5 text-center">
                            <HiOutlineUsers className="w-8 h-8 text-primary-400 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-slate-900">{users.length}</p>
                            <p className="text-sm text-slate-500">Total Users</p>
                        </div>
                        <div className="glass-card p-5 text-center">
                            <HiOutlineShieldCheck className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-slate-900">{users.filter(u => u.role === 'ADMIN').length}</p>
                            <p className="text-sm text-slate-500">Admins</p>
                        </div>
                        <div className="glass-card p-5 text-center">
                            <HiOutlineCog6Tooth className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-slate-900">{users.filter(u => u.role === 'MANAGER').length}</p>
                            <p className="text-sm text-slate-500">Managers</p>
                        </div>
                    </div>

                    {/* Users Table */}
                    <div className="glass-card overflow-hidden">
                        <div className="p-5 border-b border-gray-200/50 flex justify-between items-center bg-white/50">
                            <h2 className="text-lg font-semibold text-slate-900">User Management</h2>
                            <button onClick={openAddModal} className="btn-primary py-2 text-sm">Add New User</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50/80">
                                        <th className="text-left text-sm text-slate-500 px-5 py-3 font-medium">User</th>
                                        <th className="text-left text-sm text-slate-500 px-5 py-3 font-medium">Email</th>
                                        <th className="text-left text-sm text-slate-500 px-5 py-3 font-medium">Role</th>
                                        <th className="text-left text-sm text-slate-500 px-5 py-3 font-medium">Phone</th>
                                        <th className="text-center text-sm text-slate-500 px-5 py-3 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white">
                                    {users.map((user) => (
                                        <tr key={user.id} className="border-t border-gray-100 hover:bg-slate-50/50 transition-colors">
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-xs text-white font-bold shadow-sm">
                                                        {getInitials(user.name)}
                                                    </div>
                                                    <span className="text-sm text-slate-900 font-medium">{user.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 text-sm text-slate-500">{user.email}</td>
                                            <td className="px-5 py-3"><span className={`badge ${getRoleBadgeColor(user.role)}`}>{user.role}</span></td>
                                            <td className="px-5 py-3 text-sm text-slate-500">{user.phone || '—'}</td>
                                            <td className="px-5 py-3 flex items-center justify-center gap-2">
                                                <button onClick={() => openEditModal(user)} className="p-1.5 text-slate-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors border border-transparent hover:border-primary-100" title="Edit User & Password">
                                                    <HiPencil className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(user.id)} className="p-1.5 text-slate-400 hover:text-danger-500 hover:bg-danger-50 rounded-lg transition-colors border border-transparent hover:border-danger-100" title="Delete User">
                                                    <HiTrash className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* User Config Modal */}
            <AnimatePresence>
                {isUserModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/40 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-100">
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
                                <h3 className="text-lg font-bold text-slate-900">{modalMode === 'add' ? 'Add New User' : 'Edit User & Permissions'}</h3>
                                <button onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded-lg">
                                    <HiXMark className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleUserSubmit} className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="input-label">Full Name *</label>
                                        <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" placeholder="John Doe" />
                                    </div>
                                    <div>
                                        <label className="input-label">Role *</label>
                                        <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="input-field">
                                            <option value="EMPLOYEE">Employee</option>
                                            <option value="MANAGER">Manager</option>
                                            <option value="ADMIN">Admin</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="input-label">Email *</label>
                                        <input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="input-field" placeholder="john@archconsultancy.com" />
                                    </div>
                                    <div>
                                        <label className="input-label">Phone</label>
                                        <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="input-field" placeholder="+91..." />
                                    </div>
                                </div>
                                <div>
                                    <label className="input-label">Skills (Comma separated)</label>
                                    <input type="text" value={formData.skills} onChange={(e) => setFormData({ ...formData, skills: e.target.value })} className="input-field" placeholder="AutoCAD, React..." />
                                </div>
                                {/* Profile fields */}
                                <div className="border-t pt-4">
                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Service Book Details</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="input-label">Designation</label>
                                            <input type="text" value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value })} className="input-field" placeholder="Junior Architect" />
                                        </div>
                                        <div>
                                            <label className="input-label">Father's Name</label>
                                            <input type="text" value={formData.fathersName} onChange={(e) => setFormData({ ...formData, fathersName: e.target.value })} className="input-field" placeholder="s/o Mr. Name" />
                                        </div>
                                        <div>
                                            <label className="input-label">Joining Date</label>
                                            <input type="date" value={formData.joiningDate} onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })} className="input-field" />
                                        </div>
                                        <div>
                                            <label className="input-label">PAN Card No.</label>
                                            <input type="text" value={formData.panCard} onChange={(e) => setFormData({ ...formData, panCard: e.target.value })} className="input-field" placeholder="ABCDE1234F" />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="input-label">Aadhar No.</label>
                                            <input type="text" value={formData.aadharNo} onChange={(e) => setFormData({ ...formData, aadharNo: e.target.value })} className="input-field" placeholder="XXXX-XXXX-XXXX" />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="input-label">Password {modalMode === 'edit' && '(Leave blank to keep current)'}</label>
                                    <input required={modalMode === 'add'} type="text" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="input-field" placeholder={modalMode === 'edit' ? "Keep unchanged" : "Set password"} minLength={6} />
                                </div>
                                <div className="pt-4 flex justify-end gap-3">
                                    <button type="button" onClick={() => setIsUserModalOpen(false)} className="btn-secondary">Cancel</button>
                                    <button type="submit" className="btn-primary">{modalMode === 'add' ? 'Create User' : 'Save Changes'}</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
}
