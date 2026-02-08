'use client';

import { useEffect, useState } from 'react';

interface User {
    id: string;
    username: string;
    role: string;
    isActive: boolean;
    createdAt: string;
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ username: '', password: '', role: 'PLAYER' });
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin/users');
            const data = await res.json();
            if (data.success) {
                setUsers(data.users);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (data.success) {
                setUsers([data.user, ...users]);
                setShowModal(false);
                setFormData({ username: '', password: '', role: 'PLAYER' });
            } else {
                setError(data.error || 'Failed to create user');
            }
        } catch (error) {
            setError('An error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return;

        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
            });

            const data = await res.json();

            if (data.success) {
                setUsers(users.filter((u) => u.id !== userId));
            }
        } catch (error) {
            console.error('Failed to delete user:', error);
        }
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-white">User Management</h1>
                <button onClick={() => setShowModal(true)} className="btn btn-primary px-4 py-2">
                    + Add User
                </button>
            </div>

            {/* Users Table */}
            <div className="glass rounded-xl overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto" />
                    </div>
                ) : users.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                        No users found. Create one to get started.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-dream-surface/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Username</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Role</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-400 hidden sm:table-cell">Status</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-400 hidden md:table-cell">Created</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-slate-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-dream-border">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-dream-surface/30">
                                        <td className="px-4 py-3">
                                            <span className="text-white font-medium">{user.username}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${user.role === 'ADMIN'
                                                    ? 'bg-primary-500/20 text-primary-300'
                                                    : 'bg-slate-500/20 text-slate-300'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 hidden sm:table-cell">
                                            <span className={`inline-flex items-center gap-1 text-xs ${user.isActive ? 'text-green-400' : 'text-red-400'
                                                }`}>
                                                <span className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-400' : 'bg-red-400'
                                                    }`} />
                                                {user.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-400 text-sm hidden md:table-cell">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                className="text-red-400 hover:text-red-300 text-sm"
                                                disabled={user.role === 'ADMIN'}
                                            >
                                                {user.role === 'ADMIN' ? '—' : 'Delete'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create User Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
                    <div className="glass rounded-xl p-6 w-full max-w-md animate-scale-in">
                        <h2 className="text-xl font-bold text-white mb-4">Create New User</h2>

                        <form onSubmit={handleCreate} className="space-y-4">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className="input-base"
                                    placeholder="Enter username"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="input-base"
                                    placeholder="Enter password"
                                    required
                                    minLength={4}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Role
                                </label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="input-base"
                                >
                                    <option value="PLAYER">Player</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="btn btn-secondary flex-1 py-3"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="btn btn-primary flex-1 py-3"
                                >
                                    {submitting ? 'Creating...' : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
