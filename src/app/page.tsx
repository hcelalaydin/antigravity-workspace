'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUserStore } from '@/stores/userStore';
import { AnimatedBackground, Card, Button, Input } from '@/components/ui';
import { motion } from 'framer-motion';
import Image from 'next/image';

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
    const [randomCards, setRandomCards] = useState<string[]>([]);

    useEffect(() => {
        const init = async () => {
            await checkAuth();
            setChecking(false);
        };
        init();

        const fetchRandomCards = async () => {
            try {
                const res = await fetch('/api/cards/random');
                const data = await res.json();
                if (data.success && data.cards) {
                    setRandomCards(data.cards);
                }
            } catch (e) {
                console.error('Failed to load random cards', e);
            }
        };
        fetchRandomCards();

        const savedNickname = getCookie('player_nickname');
        if (savedNickname) {
            setUsername(savedNickname);
        }
    }, [checkAuth]);

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

    if (checking) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <AnimatedBackground />
                <div className="relative z-10">
                    <div className="w-12 h-12 spinner" />
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8 sm:p-8 relative overflow-hidden">
            <AnimatedBackground />

            {/* Content */}
            <div className="relative z-10 text-center w-full max-w-2xl mx-auto">
                {/* Logo/Title */}
                <motion.div
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                >
                    <h1 className="text-5xl sm:text-6xl md:text-8xl font-bold mb-4 gradient-text-animated leading-tight font-display">
                        DreamWeaver
                    </h1>
                    <p className="text-lg sm:text-xl text-slate-400 mb-10 sm:mb-14 font-display tracking-wide">
                        Where imagination meets deception
                    </p>
                </motion.div>

                {/* Floating Cards */}
                <motion.div
                    className="flex justify-center gap-3 sm:gap-5 mb-10 sm:mb-14"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                >
                    {[...Array(5)].map((_, i) => (
                        <motion.div
                            key={i}
                            className={`
                                w-12 h-16 sm:w-16 sm:h-24 md:w-20 md:h-28 
                                rounded-xl overflow-hidden
                                ${i === 0 || i === 4 ? 'hidden sm:block' : ''}
                            `}
                            style={{
                                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(45, 212, 191, 0.1) 100%)',
                                border: '1px solid rgba(139, 92, 246, 0.3)',
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                            }}
                            initial={{ y: 0, rotate: (i - 2) * 8 }}
                            animate={{
                                y: [0, -8, 0],
                                rotate: (i - 2) * 8,
                            }}
                            transition={{
                                y: {
                                    duration: 2 + i * 0.3,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                },
                            }}
                        >
                            {randomCards[i] ? (
                                <Image src={randomCards[i]} alt="Random Card" fill className="object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-primary-500/20 to-transparent" />
                            )}
                        </motion.div>
                    ))}
                </motion.div>

                {/* Quick Play Form */}
                <motion.form
                    onSubmit={handleQuickPlay}
                    className="flex flex-col gap-5 px-4 sm:px-0 max-w-sm mx-auto"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                >
                    <Input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter your nickname..."
                        maxLength={20}
                        className="text-center text-lg py-4"
                        disabled={loading}
                        error={error}
                    />

                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        loading={loading}
                        disabled={!username.trim()}
                        className="w-full glow-pulse"
                    >
                        🎴 Play Now
                    </Button>
                </motion.form>

                <motion.p
                    className="text-slate-500 text-xs mt-5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                >
                    <Link href="/login" className="hover:text-primary-400 transition-colors">
                        Admin login →
                    </Link>
                </motion.p>

                {/* Features */}
                <motion.div
                    className="mt-14 sm:mt-20 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 px-2 sm:px-0"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                >
                    {[
                        { icon: '🎴', title: 'Abstract Cards', desc: 'Beautiful, dreamlike images spark your imagination' },
                        { icon: '🎭', title: 'Creative Clues', desc: 'Craft clues that are neither too obvious nor too obscure' },
                        { icon: '👥', title: '3-8 Players', desc: 'Gather friends for an unforgettable game night' },
                    ].map((feature, i) => (
                        <Card
                            key={i}
                            hover
                            className="text-center"
                        >
                            <div className="text-3xl sm:text-4xl mb-3">{feature.icon}</div>
                            <h3 className="font-semibold text-white mb-2 text-sm sm:text-base">{feature.title}</h3>
                            <p className="text-xs sm:text-sm text-slate-400">{feature.desc}</p>
                        </Card>
                    ))}
                </motion.div>
            </div>
        </main>
    );
}
