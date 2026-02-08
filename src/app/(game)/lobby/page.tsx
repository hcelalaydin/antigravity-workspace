'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/stores/userStore';
import ProtectedRoute from '@/components/ProtectedRoute';

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
            // Logout and re-login with new nickname
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
            <main className="min-h-screen px-4 py-6 sm:p-8">
                {/* Header */}
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-white">
                            Game Lobby
                        </h1>
                        <div className="text-slate-400 text-sm sm:text-base flex items-center gap-2">
                            {isEditingNickname ? (
                                <div className="flex flex-col gap-1">
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
                                        <button
                                            onClick={handleNicknameChange}
                                            disabled={savingNickname}
                                            className="btn btn-primary px-2 py-1 text-xs"
                                        >
                                            {savingNickname ? '...' : '✓'}
                                        </button>
                                        <button
                                            onClick={() => setIsEditingNickname(false)}
                                            className="btn btn-ghost px-2 py-1 text-xs"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    {nicknameError && (
                                        <span className="text-red-400 text-xs">{nicknameError}</span>
                                    )}
                                </div>
                            ) : (
                                <>
                                    Welcome, <span className="text-primary-400">{user?.username}</span>
                                    <button
                                        onClick={startEditingNickname}
                                        className="text-slate-500 hover:text-primary-400 transition-colors"
                                        title="Change nickname"
                                    >
                                        ✏️
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-3">
                        {user?.role === 'ADMIN' && (
                            <a href="/admin" className="btn btn-secondary px-4 py-2 text-sm">
                                Admin Panel
                            </a>
                        )}
                        <button onClick={logout} className="btn btn-ghost px-4 py-2 text-sm">
                            Logout
                        </button>
                    </div>
                </header>

                {/* Content */}
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Create Room Button */}
                    <div className="glass rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Create a New Game</h2>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="btn btn-primary px-6 py-3 w-full sm:w-auto"
                        >
                            + Create Room
                        </button>
                    </div>

                    {/* Join Room */}
                    <div className="glass rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Join a Game</h2>
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm mb-4">
                                {error}
                            </div>
                        )}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="text"
                                placeholder="Enter room code (e.g., ABC123)"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                onKeyDown={(e) => e.key === 'Enter' && handleJoinByCode()}
                                className="input-base flex-1 uppercase tracking-widest text-center sm:text-left"
                                maxLength={6}
                            />
                            <button
                                onClick={handleJoinByCode}
                                disabled={joining || !joinCode.trim()}
                                className="btn btn-secondary px-6 py-3"
                            >
                                {joining ? 'Joining...' : 'Join Room'}
                            </button>
                        </div>
                    </div>

                    {/* Your Rooms */}
                    <div className="glass rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Your Active Rooms</h2>
                        {loading ? (
                            <div className="py-4 text-center">
                                <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto" />
                            </div>
                        ) : rooms.length === 0 ? (
                            <p className="text-slate-400 text-sm">
                                No active rooms yet. Create one to start playing!
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {rooms.map((room) => (
                                    <div
                                        key={room.id}
                                        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 rounded-lg bg-dream-surface/50 border border-dream-border hover:border-primary-500/30 transition-colors"
                                    >
                                        <div>
                                            <h3 className="font-medium text-white">{room.name}</h3>
                                            <p className="text-sm text-slate-400">
                                                Code: <span className="text-primary-400 font-mono">{room.code}</span>
                                                {' • '}
                                                Host: {room.hostName}
                                                {' • '}
                                                {room.playerCount}/{room.maxPlayers} players
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs px-2 py-1 rounded ${room.status === 'WAITING'
                                                ? 'bg-green-500/20 text-green-400'
                                                : 'bg-yellow-500/20 text-yellow-400'
                                                }`}>
                                                {room.status === 'WAITING' ? 'Waiting' : 'In Game'}
                                            </span>
                                            <button
                                                onClick={() => router.push(`/room/${room.code}`)}
                                                className="btn btn-primary px-4 py-2 text-sm"
                                            >
                                                {room.status === 'WAITING' ? 'Enter' : 'Rejoin'}
                                            </button>
                                            {room.hostId === user?.id && (
                                                <button
                                                    onClick={() => handleCloseRoom(room.code)}
                                                    className="btn btn-ghost px-3 py-2 text-sm text-red-400 hover:bg-red-500/20"
                                                    title="Close Room"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Create Room Modal */}
                {showCreateModal && (
                    <CreateRoomModal
                        onClose={() => setShowCreateModal(false)}
                        onCreated={(room) => {
                            setShowCreateModal(false);
                            router.push(`/room/${room.code}`);
                        }}
                    />
                )}
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="glass rounded-xl p-6 w-full max-w-md animate-scale-in">
                <h2 className="text-xl font-bold text-white mb-4">Create New Room</h2>

                <form onSubmit={handleCreate} className="space-y-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Room Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="input-base"
                            placeholder="Enter room name"
                            required
                            minLength={2}
                            maxLength={30}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Max Players: {maxPlayers}
                        </label>
                        <input
                            type="range"
                            min={3}
                            max={8}
                            value={maxPlayers}
                            onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                            className="w-full accent-primary-500"
                        />
                        <div className="flex justify-between text-xs text-slate-500 mt-1">
                            <span>3</span>
                            <span>8</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Points to Win: {pointsToWin}
                        </label>
                        <input
                            type="range"
                            min={10}
                            max={50}
                            step={5}
                            value={pointsToWin}
                            onChange={(e) => setPointsToWin(parseInt(e.target.value))}
                            className="w-full accent-primary-500"
                        />
                        <div className="flex justify-between text-xs text-slate-500 mt-1">
                            <span>10</span>
                            <span>50</span>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-secondary flex-1 py-3"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={creating}
                            className="btn btn-primary flex-1 py-3"
                        >
                            {creating ? 'Creating...' : 'Create Room'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
