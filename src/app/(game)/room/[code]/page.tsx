'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/stores/userStore';
import ProtectedRoute from '@/components/ProtectedRoute';

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
        // Poll for updates every 2 seconds while waiting
        const interval = setInterval(fetchRoom, 2000);
        return () => clearInterval(interval);
    }, [fetchRoom]);

    // Auto-redirect to game when it starts
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

    return (
        <ProtectedRoute>
            <main className="min-h-screen px-4 py-6 sm:p-8">
                {loading ? (
                    <div className="min-h-[60vh] flex items-center justify-center">
                        <div className="text-center">
                            <div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
                            <p className="text-slate-400">Loading room...</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="min-h-[60vh] flex items-center justify-center">
                        <div className="text-center glass rounded-xl p-8 max-w-md">
                            <div className="text-4xl mb-4">😶</div>
                            <h2 className="text-xl font-bold text-white mb-2">Room Not Found</h2>
                            <p className="text-slate-400 mb-6">{error}</p>
                            <button
                                onClick={() => router.push('/lobby')}
                                className="btn btn-primary px-6 py-3"
                            >
                                Back to Lobby
                            </button>
                        </div>
                    </div>
                ) : room?.status === 'PLAYING' ? (
                    // Game in progress - redirect or show game UI
                    <div className="min-h-[60vh] flex items-center justify-center">
                        <div className="text-center glass rounded-xl p-8 max-w-md">
                            <div className="text-4xl mb-4">🎮</div>
                            <h2 className="text-xl font-bold text-white mb-2">Game In Progress</h2>
                            <p className="text-slate-400 mb-6">The game has started!</p>
                            <button
                                onClick={() => router.push(`/game/${room.code}`)}
                                className="btn btn-primary px-6 py-3"
                            >
                                Join Game
                            </button>
                        </div>
                    </div>
                ) : (
                    // Waiting room
                    <div className="max-w-2xl mx-auto">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-white">{room?.name}</h1>
                                <p className="text-slate-400 text-sm">Waiting for players...</p>
                            </div>
                            <button onClick={handleLeave} className="btn btn-ghost text-sm">
                                Leave Room
                            </button>
                        </div>

                        {/* Room Code Card */}
                        <div className="glass rounded-xl p-6 mb-6 text-center">
                            <p className="text-slate-400 text-sm mb-2">Room Code</p>
                            <p className="text-4xl sm:text-5xl font-mono font-bold text-primary-400 tracking-widest mb-4">
                                {room?.code}
                            </p>
                            <button
                                onClick={copyInviteLink}
                                className="btn btn-secondary px-4 py-2 text-sm"
                            >
                                {copied ? '✓ Copied!' : '📋 Copy Invite Link'}
                            </button>
                        </div>

                        {/* Players List */}
                        <div className="glass rounded-xl p-6 mb-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold text-white">
                                    Players ({room?.players.length}/{room?.maxPlayers})
                                </h2>
                                <span className="text-sm text-slate-400">
                                    🏆 {room?.pointsToWin} points to win
                                </span>
                            </div>

                            <div className="space-y-3">
                                {room?.players.map((player) => (
                                    <div
                                        key={player.id}
                                        className={`flex items-center justify-between p-3 rounded-lg border ${player.isHost
                                            ? 'bg-primary-500/10 border-primary-500/30'
                                            : 'bg-dream-surface/50 border-dream-border'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${player.isHost ? 'bg-primary-500/30 text-primary-300' : 'bg-slate-700 text-slate-300'
                                                }`}>
                                                {player.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-white">
                                                    {player.username}
                                                    {player.isHost && (
                                                        <span className="ml-2 text-xs text-primary-400">👑 Host</span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <div>
                                            {player.isHost ? (
                                                <span className="text-xs text-slate-400">—</span>
                                            ) : player.isReady ? (
                                                <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400">
                                                    ✓ Ready
                                                </span>
                                            ) : (
                                                <span className="text-xs px-2 py-1 rounded bg-slate-700/50 text-slate-400">
                                                    Waiting...
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {(room?.players.length ?? 0) < 3 && (
                                <p className="mt-4 text-center text-sm text-yellow-400">
                                    ⚠️ Need at least 3 players to start
                                </p>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            {!isHost && (
                                <button
                                    onClick={handleReady}
                                    className={`btn flex-1 py-4 text-lg ${currentPlayer?.isReady ? 'btn-secondary' : 'btn-primary'
                                        }`}
                                >
                                    {currentPlayer?.isReady ? '✓ Ready (Click to Unready)' : "I'm Ready!"}
                                </button>
                            )}

                            {isHost && (
                                <button
                                    onClick={handleStartGame}
                                    disabled={!canStart}
                                    className="btn btn-primary flex-1 py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {canStart ? '🎮 Start Game' : `Waiting for players${(room?.players.length ?? 0) < 3 ? ' (need 3+)' : '...'}`}
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </ProtectedRoute>
    );
}
