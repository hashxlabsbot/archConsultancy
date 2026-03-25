import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
    return inputs.filter(Boolean).join(' ');
}

export function formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export function formatTime(date: Date | string): string {
    return new Date(date).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function formatDateTime(date: Date | string): string {
    return `${formatDate(date)} ${formatTime(date)}`;
}

export function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

export function getRoleBadgeColor(role: string): string {
    switch (role) {
        case 'ADMIN':
            return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
        case 'MANAGER':
            return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
        case 'EMPLOYEE':
            return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
        default:
            return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
}

export function getStatusBadgeColor(status: string): string {
    switch (status) {
        case 'ACTIVE':
        case 'APPROVED':
            return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
        case 'PENDING':
            return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
        case 'REJECTED':
            return 'bg-red-500/20 text-red-300 border-red-500/30';
        case 'COMPLETED':
            return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
        case 'ON_HOLD':
            return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
        default:
            return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
}
