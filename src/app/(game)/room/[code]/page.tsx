'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/stores/userStore';
import ProtectedRoute from '@/components/ProtectedRoute';
import { AnimatedBackground, Card, Button, Avatar } from '@/components/ui';
import { motion, AnimatePresence } from 'framer-motion';

interface Player {
    id: string;
    userId: string;
    username: string;
    isReady: boolean;
    isOnline: boolean;
    score: number;
    isHost: boolean;
}

interface RoomData {
    id: string;
    code: string;
    name: string;
    status: string;
    hostId: string;
    hostName: string;
    maxPlayers: number;
    pointsToWin: number;
    players: Player[];
}

export default function RoomPage({ params }: { params: { code: string } }) {
    const router = useRouter();
    const { user } = useUserStore();
    const [room, setRoom] = useState<RoomData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const fetchRoom = useCallback(async () => {
        try {
            const res = await fetch(`/api/rooms/${params.code}`);
            const data = await res.json();

            if (data.success) {
                setRoom(data.room);
                setError('');
            } else {
                setError(data.error || 'Room not found');
            }
        } catch (err) {
            setError('Failed to load room');
        } finally {
            setLoading(false);
        }
    }, [params.code]);

    useEffect(() => {
        fetchRoom();
        const interval = setInterval(fetchRoom, 2000);
        return () => clearInterval(interval);
    }, [fetchRoom]);

    useEffect(() => {
        if (room?.status === 'PLAYING') {
            router.push(`/game/${room.code}`);
        }
    }, [room?.status, room?.code, router]);

    const handleReady = async () => {
        try {
            const res = await fetch(`/api/rooms/${params.code}/ready`, {
                method: 'POST',
            });
            const data = await res.json();
            if (data.success) {
                fetchRoom();
            }
        } catch (err) {
            console.error('Failed to toggle ready:', err);
        }
    };

    const handleLeave = async () => {
        if (!confirm('Are you sure you want to leave?')) return;

        try {
            await fetch(`/api/rooms/${params.code}`, {
                method: 'DELETE',
            });
            router.push('/lobby');
        } catch (err) {
            console.error('Failed to leave room:', err);
        }
    };

    const handleStartGame = async () => {
        try {
            const res = await fetch(`/api/rooms/${params.code}/start`, {
                method: 'POST',
            });
            const data = await res.json();
            if (!data.success) {
                alert(data.error || 'Failed to start game');
            } else {
                fetchRoom();
            }
        } catch (err) {
            console.error('Failed to start game:', err);
        }
    };

    const copyInviteLink = () => {
        const url = `${window.location.origin}/room/${room?.code}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const isHost = room?.hostId === user?.id;
    const currentPlayer = room?.players.find((p) => p.userId === user?.id);
    const allReady = room?.players.every((p) => p.isReady || p.isHost);
    const canStart = isHost && allReady && (room?.players.length ?? 0) >= 3;

    if (loading) {
        return (
            <ProtectedRoute>
                <main className="min-h-screen flex items-center justify-center relative">
                    <AnimatedBackground />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative z-10"
                    >
                        <div className="w-12 h-12 spinner mx-auto" />
                        <p className="text-slate-400 mt-4">Loading room...</p>
                    </motion.div>
                </main>
            </ProtectedRoute>
        );
    }

    if (error || !room || room?.status === 'CLOSED') {
        return (
            <ProtectedRoute>
                <main className="min-h-screen flex items-center justify-center p-4 relative">
                    <AnimatedBackground />
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative z-10"
                    >
                        <Card variant="elevated" className="text-center max-w-md">
                            <div className="text-5xl mb-4">🌙</div>
                            <h2 className="text-2xl font-bold text-white mb-2">Room Not Found</h2>
                            <p className="text-slate-400 mb-6">{error || 'This room may have been closed.'}</p>
                            <Button onClick={() => router.push('/lobby')} variant="primary" className="w-full">
                                Back to Lobby
                            </Button>
                        </Card>
                    </motion.div>
                </main>
            </ProtectedRoute>
        );
    }

    if (room?.status === 'PLAYING') {
        return (
            <ProtectedRoute>
                <main className="min-h-screen flex items-center justify-center p-4 relative">
                    <AnimatedBackground />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative z-10"
                    >
                        <Card variant="glow" className="text-center max-w-md">
                            <div className="text-5xl mb-4 animate-float">🎮</div>
                            <h2 className="text-2xl font-bold text-white mb-2">Game In Progress!</h2>
                            <p className="text-slate-400 mb-6">The game has started</p>
                            <Button onClick={() => router.push(`/game/${room.code}`)} variant="primary" className="w-full glow-pulse">
                                Join Game
                            </Button>
                        </Card>
                    </motion.div>
                </main>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <main className="min-h-screen px-4 py-6 sm:p-8 relative">
                <AnimatedBackground />

                <div className="relative z-10 max-w-2xl mx-auto">
                    {/* Header */}
                    <motion.header
                        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold gradient-text">{room?.name}</h1>
                            <p className="text-slate-400 text-sm flex items-center gap-2 mt-1">
                                <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                Waiting for players...
                            </p>
                        </div>
                        <Button onClick={handleLeave} variant="ghost" size="sm">
                            ← Leave Room
                        </Button>
                    </motion.header>

                    {/* Room Code Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Card variant="elevated" className="text-center mb-6">
                            <p className="text-slate-400 text-sm mb-2">Room Code</p>
                            <p className="text-5xl sm:text-6xl font-bold room-code mb-4 py-2">
                                {room?.code}
                            </p>
                            <Button
                                onClick={copyInviteLink}
                                variant="secondary"
                                size="sm"
                                icon={copied ? '✓' : '📋'}
                            >
                                {copied ? 'Copied!' : 'Copy Invite Link'}
                            </Button>
                        </Card>
                    </motion.div>

                    {/* Players List */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Card variant="default" className="mb-6">
                            <div className="flex justify-between items-center mb-5">
                                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <span>Players</span>
                                    <span className="badge badge-primary">
                                        {room?.players.length}/{room?.maxPlayers}
                                    </span>
                                </h2>
                                <span className="text-sm text-slate-400 flex items-center gap-1">
                                    🏆 {room?.pointsToWin} pts to win
                                </span>
                            </div>

                            <div className="space-y-3">
                                <AnimatePresence>
                                    {room?.players.map((player, index) => (
                                        <motion.div
                                            key={player.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            transition={{ delay: index * 0.05 }}
                                            className={`flex items-center justify-between p-3 rounded-xl border transition-all ${player.isHost
                                                    ? 'bg-gradient-to-r from-primary-500/10 to-transparent border-primary-500/30'
                                                    : 'bg-dream-surface/30 border-dream-border hover:border-primary-500/20'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Avatar
                                                    name={player.username}
                                                    size="md"
                                                    showRing={player.isHost}
                                                    online
                                                />
                                                <div>
                                                    <p className="font-medium text-white flex items-center gap-2">
                                                        {player.username}
                                                        {player.isHost && (
                                                            <span className="text-xs text-primary-400 flex items-center gap-1">
                                                                👑 Host
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            <div>
                                                {player.isHost ? (
                                                    <span className="text-xs text-slate-500">—</span>
                                                ) : player.isReady ? (
                                                    <span className="badge badge-success">
                                                        ✓ Ready
                                                    </span>
                                                ) : (
                                                    <span className="badge text-slate-400 bg-slate-700/30 border-slate-600/30">
                                                        Waiting...
                                                    </span>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>

                            {(room?.players.length ?? 0) < 3 && (
                                <motion.p
                                    className="mt-4 text-center text-sm py-2 px-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    ⚠️ Need at least 3 players to start
                                </motion.p>
                            )}
                        </Card>
                    </motion.div>

                    {/* Action Buttons */}
                    <motion.div
                        className="flex flex-col sm:flex-row gap-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        {!isHost && (
                            <Button
                                onClick={handleReady}
                                variant={currentPlayer?.isReady ? 'secondary' : 'primary'}
                                className={`flex-1 py-4 text-lg ${!currentPlayer?.isReady ? 'glow-pulse' : ''}`}
                            >
                                {currentPlayer?.isReady ? '✓ Ready (Click to Unready)' : "I'm Ready!"}
                            </Button>
                        )}

                        {isHost && (
                            <Button
                                onClick={handleStartGame}
                                disabled={!canStart}
                                variant="primary"
                                className={`flex-1 py-4 text-lg ${canStart ? 'glow-pulse' : ''}`}
                            >
                                {canStart ? '🎮 Start Game' : `Waiting for players${(room?.players.length ?? 0) < 3 ? ' (need 3+)' : '...'}`}
                            </Button>
                        )}
                    </motion.div>
                </div>
            </main>
        </ProtectedRoute>
    );
}
