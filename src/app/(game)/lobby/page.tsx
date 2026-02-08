'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/stores/userStore';
import ProtectedRoute from '@/components/ProtectedRoute';
import { AnimatedBackground, Card, Button, Input, Avatar } from '@/components/ui';
import { motion, AnimatePresence } from 'framer-motion';

// Cookie helper
const setCookie = (name: string, value: string, days: number) => {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${name}=${value}; expires=${expires}; path=/`;
};

interface Room {
    id: string;
    code: string;
    name: string;
    status: string;
    hostId: string;
    hostName: string;
    playerCount: number;
    maxPlayers: number;
}

export default function LobbyPage() {
    const router = useRouter();
    const { user, logout, setUser } = useUserStore();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [joining, setJoining] = useState(false);
    const [error, setError] = useState('');

    // Nickname editing state
    const [isEditingNickname, setIsEditingNickname] = useState(false);
    const [newNickname, setNewNickname] = useState('');
    const [nicknameError, setNicknameError] = useState('');
    const [savingNickname, setSavingNickname] = useState(false);

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        try {
            const res = await fetch('/api/rooms?filter=my');
            const data = await res.json();
            if (data.success) {
                setRooms(data.rooms);
            }
        } catch (error) {
            console.error('Failed to fetch rooms:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCloseRoom = async (roomCode: string) => {
        if (!confirm('Are you sure you want to close this room?')) return;

        try {
            const res = await fetch(`/api/rooms/${roomCode}/close`, {
                method: 'POST',
            });
            const data = await res.json();
            if (data.success) {
                fetchRooms();
            } else {
                alert(data.error || 'Failed to close room');
            }
        } catch (error) {
            alert('Failed to close room');
        }
    };

    const handleJoinByCode = async () => {
        if (!joinCode.trim()) return;

        setJoining(true);
        setError('');

        try {
            const res = await fetch(`/api/rooms/${joinCode.toUpperCase()}`, {
                method: 'POST',
            });
            const data = await res.json();

            if (data.success) {
                router.push(`/room/${data.room.code}`);
            } else {
                setError(data.error || 'Failed to join room');
            }
        } catch (error) {
            setError('Failed to join room');
        } finally {
            setJoining(false);
        }
    };

    const handleNicknameChange = async () => {
        if (!newNickname.trim() || newNickname.trim().length < 2) {
            setNicknameError('Nickname must be at least 2 characters');
            return;
        }

        setSavingNickname(true);
        setNicknameError('');

        try {
            await fetch('/api/auth/logout', { method: 'POST' });

            const res = await fetch('/api/auth/guest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: newNickname.trim() }),
            });

            const data = await res.json();

            if (data.success) {
                setCookie('player_nickname', data.user.username, 7);
                setUser(data.user);
                setIsEditingNickname(false);
            } else {
                setNicknameError(data.error || 'Failed to change nickname');
            }
        } catch (error) {
            setNicknameError('Failed to change nickname');
        } finally {
            setSavingNickname(false);
        }
    };

    const startEditingNickname = () => {
        setNewNickname(user?.username || '');
        setIsEditingNickname(true);
        setNicknameError('');
    };

    return (
        <ProtectedRoute>
            <main className="min-h-screen px-4 py-6 sm:p-8 relative">
                <AnimatedBackground />

                <div className="relative z-10">
                    {/* Header */}
                    <motion.header
                        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 max-w-5xl mx-auto"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="flex items-center gap-4">
                            <Avatar name={user?.username || 'U'} size="lg" showRing />
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold gradient-text">
                                    Game Lobby
                                </h1>
                                {isEditingNickname ? (
                                    <div className="flex flex-col gap-1 mt-1">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={newNickname}
                                                onChange={(e) => setNewNickname(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleNicknameChange()}
                                                className="input-base py-1 px-2 text-sm w-32"
                                                maxLength={20}
                                                autoFocus
                                                disabled={savingNickname}
                                            />
                                            <Button
                                                onClick={handleNicknameChange}
                                                disabled={savingNickname}
                                                size="sm"
                                                variant="primary"
                                            >
                                                {savingNickname ? '...' : '✓'}
                                            </Button>
                                            <Button
                                                onClick={() => setIsEditingNickname(false)}
                                                size="sm"
                                                variant="ghost"
                                            >
                                                ✕
                                            </Button>
                                        </div>
                                        {nicknameError && (
                                            <span className="text-red-400 text-xs">{nicknameError}</span>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-slate-400 text-sm flex items-center gap-2">
                                        <span>Playing as</span>
                                        <span className="text-primary-400 font-semibold">{user?.username}</span>
                                        <button
                                            onClick={startEditingNickname}
                                            className="text-slate-500 hover:text-primary-400 transition-colors text-xs"
                                            title="Change nickname"
                                        >
                                            ✏️
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-3">
                            {user?.role === 'ADMIN' && (
                                <Button
                                    onClick={() => router.push('/admin')}
                                    variant="secondary"
                                    size="sm"
                                >
                                    ⚙️ Admin
                                </Button>
                            )}
                            <Button onClick={logout} variant="ghost" size="sm">
                                Logout
                            </Button>
                        </div>
                    </motion.header>

                    {/* Content Grid */}
                    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column - Actions */}
                        <div className="space-y-6">
                            {/* Create Room Card */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <Card variant="elevated" hover className="cursor-pointer group" onClick={() => setShowCreateModal(true)}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform">
                                            ✨
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-lg font-semibold text-white group-hover:text-primary-300 transition-colors">
                                                Create New Game
                                            </h2>
                                            <p className="text-sm text-slate-400">
                                                Start a room and invite friends
                                            </p>
                                        </div>
                                        <span className="text-2xl text-slate-600 group-hover:text-primary-400 transition-colors">→</span>
                                    </div>
                                </Card>
                            </motion.div>

                            {/* Join Room */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <Card variant="default">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-10 h-10 rounded-lg bg-secondary-500/20 flex items-center justify-center text-xl">
                                            🎯
                                        </div>
                                        <h2 className="text-lg font-semibold text-white">Join a Game</h2>
                                    </div>

                                    {error && (
                                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2 text-red-400 text-sm mb-4">
                                            {error}
                                        </div>
                                    )}

                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <input
                                            type="text"
                                            placeholder="Enter room code"
                                            value={joinCode}
                                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                            onKeyDown={(e) => e.key === 'Enter' && handleJoinByCode()}
                                            className="input-base flex-1 uppercase tracking-[0.3em] text-center font-mono text-lg"
                                            maxLength={6}
                                        />
                                        <Button
                                            onClick={handleJoinByCode}
                                            loading={joining}
                                            disabled={!joinCode.trim()}
                                            variant="secondary"
                                        >
                                            Join
                                        </Button>
                                    </div>
                                </Card>
                            </motion.div>
                        </div>

                        {/* Right Column - Rooms List */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <Card variant="default" padding="none" className="overflow-hidden">
                                <div className="p-6 border-b border-dream-border">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-accent-gold/20 flex items-center justify-center text-xl">
                                            🏠
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold text-white">Your Rooms</h2>
                                            <p className="text-xs text-slate-500">{rooms.length} active</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="max-h-[400px] overflow-y-auto">
                                    {loading ? (
                                        <div className="py-12 text-center">
                                            <div className="w-10 h-10 spinner mx-auto" />
                                        </div>
                                    ) : rooms.length === 0 ? (
                                        <div className="py-12 text-center px-6">
                                            <div className="text-4xl mb-3 opacity-50">🌙</div>
                                            <p className="text-slate-400 text-sm">
                                                No active rooms yet
                                            </p>
                                            <p className="text-slate-500 text-xs mt-1">
                                                Create one to start playing!
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-dream-border">
                                            {rooms.map((room) => (
                                                <motion.div
                                                    key={room.id}
                                                    className="p-4 hover:bg-white/[0.02] transition-colors"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                >
                                                    <div className="flex justify-between items-start gap-3">
                                                        <div className="min-w-0 flex-1">
                                                            <h3 className="font-medium text-white truncate">{room.name}</h3>
                                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                                <span className="text-primary-400 font-mono text-sm tracking-wider">
                                                                    {room.code}
                                                                </span>
                                                                <span className="text-slate-600">•</span>
                                                                <span className="text-slate-400 text-sm">
                                                                    {room.playerCount}/{room.maxPlayers}
                                                                </span>
                                                                <span className={`badge ${room.status === 'WAITING' ? 'badge-success' : 'badge-warning'}`}>
                                                                    {room.status === 'WAITING' ? 'Waiting' : 'Playing'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 flex-shrink-0">
                                                            <Button
                                                                onClick={() => router.push(`/room/${room.code}`)}
                                                                variant="primary"
                                                                size="sm"
                                                            >
                                                                {room.status === 'WAITING' ? 'Enter' : 'Rejoin'}
                                                            </Button>
                                                            {room.hostId === user?.id && (
                                                                <Button
                                                                    onClick={() => handleCloseRoom(room.code)}
                                                                    variant="danger"
                                                                    size="sm"
                                                                >
                                                                    ✕
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </motion.div>
                    </div>
                </div>

                {/* Create Room Modal */}
                <AnimatePresence>
                    {showCreateModal && (
                        <CreateRoomModal
                            onClose={() => setShowCreateModal(false)}
                            onCreated={(room) => {
                                setShowCreateModal(false);
                                router.push(`/room/${room.code}`);
                            }}
                        />
                    )}
                </AnimatePresence>
            </main>
        </ProtectedRoute>
    );
}

function CreateRoomModal({
    onClose,
    onCreated,
}: {
    onClose: () => void;
    onCreated: (room: { code: string }) => void;
}) {
    const [name, setName] = useState('');
    const [maxPlayers, setMaxPlayers] = useState(6);
    const [pointsToWin, setPointsToWin] = useState(30);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setCreating(true);

        try {
            const res = await fetch('/api/rooms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, maxPlayers, pointsToWin }),
            });

            const data = await res.json();

            if (data.success) {
                onCreated(data.room);
            } else {
                setError(data.error || 'Failed to create room');
            }
        } catch (error) {
            setError('Failed to create room');
        } finally {
            setCreating(false);
        }
    };

    return (
        <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="glass rounded-2xl p-6 w-full max-w-md shadow-glow-lg"
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-xl shadow-lg">
                        ✨
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Create Room</h2>
                        <p className="text-sm text-slate-400">Set up your game</p>
                    </div>
                </div>

                <form onSubmit={handleCreate} className="space-y-5">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <Input
                        label="Room Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Epic Game Night"
                        required
                        maxLength={30}
                    />

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-3">
                            Max Players: <span className="text-primary-400 font-bold">{maxPlayers}</span>
                        </label>
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-slate-500">3</span>
                            <input
                                type="range"
                                min={3}
                                max={8}
                                value={maxPlayers}
                                onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                                className="flex-1 accent-primary-500 h-2 rounded-full bg-dream-surface appearance-none cursor-pointer"
                            />
                            <span className="text-sm text-slate-500">8</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-3">
                            Points to Win: <span className="text-primary-400 font-bold">{pointsToWin}</span>
                        </label>
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-slate-500">10</span>
                            <input
                                type="range"
                                min={10}
                                max={50}
                                step={5}
                                value={pointsToWin}
                                onChange={(e) => setPointsToWin(parseInt(e.target.value))}
                                className="flex-1 accent-primary-500 h-2 rounded-full bg-dream-surface appearance-none cursor-pointer"
                            />
                            <span className="text-sm text-slate-500">50</span>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button
                            type="button"
                            onClick={onClose}
                            variant="secondary"
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            loading={creating}
                            variant="primary"
                            className="flex-1"
                        >
                            Create Room
                        </Button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}
