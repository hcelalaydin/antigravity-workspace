'use client';

import { useEffect, useState } from 'react';

interface Stats {
    users: number;
    cards: number;
    rooms: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats>({ users: 0, cards: 0, rooms: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/admin/stats');
            const data = await res.json();
            if (data.success) {
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-6">Dashboard</h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
                <StatCard
                    icon="👥"
                    label="Total Users"
                    value={stats.users}
                    loading={loading}
                    color="primary"
                />
                <StatCard
                    icon="🎴"
                    label="Total Cards"
                    value={stats.cards}
                    loading={loading}
                    color="secondary"
                />
                <StatCard
                    icon="🎮"
                    label="Active Rooms"
                    value={stats.rooms}
                    loading={loading}
                    color="accent"
                />
            </div>

            {/* Quick Actions */}
            <div className="glass rounded-xl p-4 md:p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <a href="/admin/users" className="btn btn-secondary py-3 text-center">
                        + Add New User
                    </a>
                    <a href="/admin/cards" className="btn btn-secondary py-3 text-center">
                        + Upload Cards
                    </a>
                </div>
            </div>
        </div>
    );
}

function StatCard({
    icon,
    label,
    value,
    loading,
    color,
}: {
    icon: string;
    label: string;
    value: number;
    loading: boolean;
    color: 'primary' | 'secondary' | 'accent';
}) {
    const colorClasses = {
        primary: 'from-primary-500/20 to-primary-600/10 border-primary-500/20',
        secondary: 'from-secondary-500/20 to-secondary-600/10 border-secondary-500/20',
        accent: 'from-accent-gold/20 to-accent-gold/10 border-accent-gold/20',
    };

    return (
        <div className={`glass rounded-xl p-4 md:p-6 bg-gradient-to-br ${colorClasses[color]}`}>
            <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl md:text-3xl">{icon}</span>
                <span className="text-slate-400 text-sm">{label}</span>
            </div>
            {loading ? (
                <div className="h-8 w-16 bg-slate-700/50 rounded animate-pulse" />
            ) : (
                <p className="text-2xl md:text-3xl font-bold text-white">{value}</p>
            )}
        </div>
    );
}
