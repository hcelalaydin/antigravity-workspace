'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUserStore } from '@/stores/userStore';

// Cookie helpers
const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
};

const setCookie = (name: string, value: string, days: number) => {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${name}=${value}; expires=${expires}; path=/`;
};

export default function Home() {
    const router = useRouter();
    const { setUser, isAuthenticated, checkAuth } = useUserStore();
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [checking, setChecking] = useState(true);

    // Check if already authenticated on mount
    useEffect(() => {
        const init = async () => {
            await checkAuth();
            setChecking(false);
        };
        init();

        // Load saved nickname from cookie
        const savedNickname = getCookie('player_nickname');
        if (savedNickname) {
            setUsername(savedNickname);
        }
    }, [checkAuth]);

    // Redirect to lobby if already authenticated
    useEffect(() => {
        if (!checking && isAuthenticated) {
            router.push('/lobby');
        }
    }, [checking, isAuthenticated, router]);

    const handleQuickPlay = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim() || loading) return;

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/guest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username.trim() }),
            });

            const data = await res.json();

            if (data.success) {
                // Save nickname to cookie for 7 days
                setCookie('player_nickname', data.user.username, 7);
                setUser(data.user);
                router.push('/lobby');
            } else {
                setError(data.error || 'Failed to join');
            }
        } catch (err) {
            setError('Connection error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Show loading while checking auth
    if (checking) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full" />
            </main>
        );
    }

    return (
        <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8 sm:p-8">
            {/* Background glow effect */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-48 h-48 sm:w-96 sm:h-96 bg-primary-600/20 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-48 h-48 sm:w-96 sm:h-96 bg-primary-800/20 rounded-full blur-3xl" />
            </div>

            {/* Content */}
            <div className="relative z-10 text-center w-full max-w-2xl mx-auto">
                {/* Logo/Title */}
                <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-primary-300 via-primary-400 to-secondary-400 bg-clip-text text-transparent leading-tight">
                    DreamWeaver
                </h1>

                <p className="text-base sm:text-xl text-slate-400 mb-8 sm:mb-12 clue-text px-4">
                    Where imagination meets deception
                </p>

                {/* Cards decoration */}
                <div className="flex justify-center gap-2 sm:gap-4 mb-8 sm:mb-12">
                    {[...Array(5)].map((_, i) => (
                        <div
                            key={i}
                            className={`w-10 h-14 sm:w-16 sm:h-24 md:w-20 md:h-28 rounded-lg bg-gradient-to-br from-primary-600/30 to-primary-900/30 border border-primary-500/20 shadow-lg ${i === 0 || i === 4 ? 'hidden sm:block' : ''}`}
                            style={{
                                transform: `rotate(${(i - 2) * 8}deg)`,
                                animation: `float 3s ease-in-out ${i * 0.2}s infinite`,
                            }}
                        />
                    ))}
                </div>

                {/* Quick Play Form */}
                <form onSubmit={handleQuickPlay} className="flex flex-col gap-4 px-4 sm:px-0 max-w-sm mx-auto">
                    <div className="relative">
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter your name..."
                            maxLength={20}
                            className="input-base text-center text-lg py-4"
                            disabled={loading}
                        />
                    </div>

                    {error && (
                        <p className="text-red-400 text-sm">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={!username.trim() || loading}
                        className="btn btn-primary px-6 py-4 text-lg w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Joining...
                            </span>
                        ) : (
                            '🎴 Play Now'
                        )}
                    </button>
                </form>

                <p className="text-slate-500 text-xs mt-4">
                    <Link href="/login" className="hover:text-primary-400 transition-colors">
                        Admin login →
                    </Link>
                </p>

                {/* Features */}
                <div className="mt-10 sm:mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 px-2 sm:px-0">
                    <div className="glass rounded-xl p-4 sm:p-6">
                        <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">🎴</div>
                        <h3 className="font-semibold text-white mb-1 sm:mb-2 text-sm sm:text-base">Abstract Cards</h3>
                        <p className="text-xs sm:text-sm text-slate-400">
                            Beautiful, dreamlike images spark your imagination
                        </p>
                    </div>
                    <div className="glass rounded-xl p-4 sm:p-6">
                        <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">🎭</div>
                        <h3 className="font-semibold text-white mb-1 sm:mb-2 text-sm sm:text-base">Creative Clues</h3>
                        <p className="text-xs sm:text-sm text-slate-400">
                            Craft clues that are neither too obvious nor too obscure
                        </p>
                    </div>
                    <div className="glass rounded-xl p-4 sm:p-6">
                        <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">👥</div>
                        <h3 className="font-semibold text-white mb-1 sm:mb-2 text-sm sm:text-base">3-8 Players</h3>
                        <p className="text-xs sm:text-sm text-slate-400">
                            Gather friends for an unforgettable game night
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}
