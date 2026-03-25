'use client';

import { useSession, signOut } from 'next-auth/react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
    HiOutlineBell,
    HiOutlineArrowRightOnRectangle,
    HiOutlineExclamationTriangle,
    HiOutlineKey,
    HiXMark,
} from 'react-icons/hi2';
import { getInitials, getRoleBadgeColor } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function Navbar() {
    const { data: session } = useSession();
    const [canLogout, setCanLogout] = useState(true);
    const [todayReport, setTodayReport] = useState<boolean>(false);
    const [checkingStatus, setCheckingStatus] = useState(false);

    // Notifications state
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);

    // Password Modal state
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [passwordLoading, setPasswordLoading] = useState(false);

    const user = session?.user;
    const role = (user as any)?.role || 'EMPLOYEE';

    // Check if user has submitted today's report (for checkout guard)
    useEffect(() => {
        if (user && role === 'EMPLOYEE') {
            checkTodayStatus();
        }
    }, [user]);

    const checkTodayStatus = async () => {
        try {
            const res = await fetch('/api/attendance/today');
            if (res.ok) {
                const data = await res.json();
                if (data.attendance && !data.attendance.reportSubmitted && data.attendance.checkIn && !data.attendance.checkOut) {
                    setCanLogout(false);
                    setTodayReport(false);
                } else {
                    setCanLogout(true);
                    setTodayReport(data.attendance?.reportSubmitted || false);
                }
            }
        } catch (error) {
            // silently fail
        }
    };

    useEffect(() => {
        if (role === 'ADMIN') fetchNotifications();
    }, [role]);

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
            }
        } catch (e) { }
    };

    const markAsRead = async (id?: string) => {
        try {
            await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            fetchNotifications();
            if (id) setShowNotifications(false); // Close dropdown if clicking a specific link
        } catch (e) { }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }
        if (passwordForm.newPassword.length < 6) {
            toast.error('New password must be at least 6 characters');
            return;
        }
        setPasswordLoading(true);
        try {
            const res = await fetch('/api/users/password', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword
                })
            });
            const data = await res.json();
            if (res.ok) {
                toast.success('Password updated successfully');
                setShowPasswordModal(false);
                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                toast.error(data.error || 'Failed to update password');
            }
        } catch (e) {
            toast.error('Something went wrong');
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleLogout = async () => {
        if (!canLogout && role === 'EMPLOYEE') {
            toast.error('Please submit your daily report before logging out!', {
                icon: '🔒',
                duration: 5000,
            });
            return;
        }
        await signOut({ callbackUrl: '/login' });
    };

    return (
        <>
            <motion.header
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="sticky top-0 z-30 glass-card rounded-none border-x-0 border-t-0 px-6 py-3"
            >
                <div className="flex items-center justify-between">
                    {/* Page title - will be set by each page */}
                    <div />

                    {/* Right side */}
                    <div className="flex items-center gap-4">
                        {/* Report warning */}
                        {!canLogout && role === 'EMPLOYEE' && (
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="flex items-center gap-2 px-3 py-1.5 bg-warning-500/10 border border-warning-500/30 rounded-xl text-xs text-warning-400"
                            >
                                <HiOutlineExclamationTriangle className="w-4 h-4" />
                                <span>Report pending</span>
                            </motion.div>
                        )}

                        {/* Notifications */}
                        {role === 'ADMIN' && (
                            <div className="relative">
                                <button
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    className="relative p-2 text-slate-500 hover:text-slate-900 transition-colors"
                                >
                                    <HiOutlineBell className="w-5 h-5" />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full animate-pulse" />
                                    )}
                                </button>

                                {/* Dropdown */}
                                {showNotifications && (
                                    <div className="absolute right-0 mt-2 w-80 bg-white/80 backdrop-blur-xl border border-white/40 shadow-xl rounded-2xl overflow-hidden z-50">
                                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white/50">
                                            <h3 className="font-semibold text-slate-900">Notifications</h3>
                                            {unreadCount > 0 && (
                                                <button
                                                    onClick={() => markAsRead()}
                                                    className="text-xs text-primary-500 hover:text-primary-600"
                                                >
                                                    Mark all read
                                                </button>
                                            )}
                                        </div>
                                        <div className="max-h-[300px] overflow-y-auto p-2 space-y-1">
                                            {notifications.map(notif => (
                                                <div
                                                    key={notif.id}
                                                    className={`p-3 rounded-xl transition ${notif.isRead ? 'opacity-70 hover:bg-slate-50' : 'bg-primary-50/50 hover:bg-primary-50'}`}
                                                >
                                                    <div className="flex justify-between items-start mb-1">
                                                        <p className={`text-sm ${notif.isRead ? 'text-slate-700' : 'font-semibold text-slate-900'}`}>{notif.title}</p>
                                                        {!notif.isRead && <span className="w-2 h-2 rounded-full bg-primary-500 mt-1" />}
                                                    </div>
                                                    <p className="text-xs text-slate-500">{notif.message}</p>
                                                    {notif.link && (
                                                        <a href={notif.link} onClick={() => markAsRead(notif.id)} className="text-xs text-primary-500 mt-2 inline-block">
                                                            View Details &rarr;
                                                        </a>
                                                    )}
                                                </div>
                                            ))}
                                            {notifications.length === 0 && (
                                                <p className="p-4 text-center text-sm text-slate-500">No notifications yet.</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* User info */}
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                                <span className={`badge ${getRoleBadgeColor(role)}`}>{role}</span>
                            </div>
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-slate-900 text-sm font-bold">
                                {user?.name ? getInitials(user.name) : '?'}
                            </div>
                        </div>

                        <div className="w-px h-6 bg-gray-200 mx-1"></div>

                        {/* Change Password */}
                        <button
                            onClick={() => setShowPasswordModal(true)}
                            className="p-2 text-slate-500 hover:text-slate-900 transition-colors"
                            title="Change Password"
                        >
                            <HiOutlineKey className="w-5 h-5" />
                        </button>

                        {/* Logout */}
                        <button
                            onClick={handleLogout}
                            className={`p-2 rounded-xl transition-all duration-200 ${!canLogout && role === 'EMPLOYEE'
                                ? 'text-slate-300 cursor-not-allowed opacity-50'
                                : 'text-slate-500 hover:text-danger-400 hover:bg-danger-500/10'
                                }`}
                            title={!canLogout && role === 'EMPLOYEE' ? 'Submit daily report to log out' : 'Log out'}
                        >
                            <HiOutlineArrowRightOnRectangle className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </motion.header>

            {/* Change Password Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100"
                    >
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <HiOutlineKey className="w-5 h-5 text-primary-500" />
                                Change Password
                            </h3>
                            <button onClick={() => setShowPasswordModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded-lg">
                                <HiXMark className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
                            <div>
                                <label className="input-label">Current Password</label>
                                <input
                                    type="password"
                                    className="input-field"
                                    value={passwordForm.currentPassword}
                                    onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="input-label">New Password</label>
                                <input
                                    type="password"
                                    className="input-field"
                                    value={passwordForm.newPassword}
                                    onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                    required
                                    minLength={6}
                                />
                            </div>
                            <div>
                                <label className="input-label">Confirm New Password</label>
                                <input
                                    type="password"
                                    className="input-field"
                                    value={passwordForm.confirmPassword}
                                    onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                    required
                                    minLength={6}
                                />
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setShowPasswordModal(false)} className="btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" disabled={passwordLoading} className="btn-primary flex items-center gap-2">
                                    {passwordLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                    Update Password
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </>
    );
}
