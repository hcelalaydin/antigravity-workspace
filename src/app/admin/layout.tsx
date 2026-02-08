'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUserStore } from '@/stores/userStore';
import ProtectedRoute from '@/components/ProtectedRoute';

const navItems = [
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    { href: '/admin/users', label: 'Users', icon: '👥' },
    { href: '/admin/cards', label: 'Cards', icon: '🎴' },
];

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const { user, logout } = useUserStore();

    return (
        <ProtectedRoute requireAdmin>
            <div className="min-h-screen flex flex-col md:flex-row">
                {/* Sidebar */}
                <aside className="w-full md:w-64 bg-dream-card border-b md:border-b-0 md:border-r border-dream-border">
                    {/* Logo */}
                    <div className="p-4 md:p-6 border-b border-dream-border">
                        <Link href="/" className="flex items-center gap-2">
                            <span className="text-xl md:text-2xl">🎴</span>
                            <span className="font-bold text-lg bg-gradient-to-r from-primary-300 to-primary-400 bg-clip-text text-transparent">
                                DreamWeaver
                            </span>
                        </Link>
                        <p className="text-xs text-slate-500 mt-1 hidden md:block">Admin Panel</p>
                    </div>

                    {/* Navigation */}
                    <nav className="p-2 md:p-4">
                        <ul className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible">
                            {navItems.map((item) => {
                                const isActive = pathname === item.href ||
                                    (item.href !== '/admin' && pathname.startsWith(item.href));
                                return (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            className={`flex items-center gap-3 px-3 py-2 md:px-4 md:py-3 rounded-lg text-sm transition-all whitespace-nowrap ${isActive
                                                    ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30'
                                                    : 'text-slate-400 hover:bg-dream-surface hover:text-white'
                                                }`}
                                        >
                                            <span>{item.icon}</span>
                                            <span>{item.label}</span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>

                    {/* User info - hidden on mobile */}
                    <div className="hidden md:block mt-auto p-4 border-t border-dream-border">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center">
                                <span className="text-primary-300 font-semibold">
                                    {user?.username?.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white">{user?.username}</p>
                                <p className="text-xs text-slate-500">{user?.role}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Link href="/lobby" className="btn btn-secondary text-xs px-3 py-2 flex-1">
                                Game Lobby
                            </Link>
                            <button onClick={logout} className="btn btn-ghost text-xs px-3 py-2">
                                Logout
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-4 md:p-8 overflow-auto">
                    {children}
                </main>
            </div>
        </ProtectedRoute>
    );
}
