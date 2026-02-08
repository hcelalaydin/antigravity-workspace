import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
    id: string;
    username: string;
    role: string;
}

interface UserState {
    user: User | null;
    isLoading: boolean;
    isLoggingIn: boolean;
    isAuthenticated: boolean;

    // Actions
    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
}

export const useUserStore = create<UserState>()(
    persist(
        (set) => ({
            user: null,
            isLoading: false,
            isLoggingIn: false,
            isAuthenticated: false,

            setUser: (user) => set({
                user,
                isAuthenticated: !!user,
                isLoading: false
            }),

            setLoading: (isLoading) => set({ isLoading }),

            login: async (username, password) => {
                set({ isLoggingIn: true });
                try {
                    const res = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, password }),
                    });

                    const data = await res.json();

                    if (data.success) {
                        set({
                            user: data.user,
                            isAuthenticated: true,
                            isLoggingIn: false
                        });
                        return true;
                    } else {
                        set({ isLoggingIn: false });
                        return false;
                    }
                } catch (error) {
                    console.error('Login error:', error);
                    set({ isLoggingIn: false });
                    return false;
                }
            },

            logout: async () => {
                try {
                    await fetch('/api/auth/logout', { method: 'POST' });
                } catch (error) {
                    console.error('Logout error:', error);
                }
                set({ user: null, isAuthenticated: false });
            },

            checkAuth: async () => {
                set({ isLoading: true });
                try {
                    const res = await fetch('/api/auth/me');
                    const data = await res.json();

                    if (data.success) {
                        set({
                            user: data.user,
                            isAuthenticated: true,
                            isLoading: false
                        });
                    } else {
                        set({
                            user: null,
                            isAuthenticated: false,
                            isLoading: false
                        });
                    }
                } catch (error) {
                    console.error('Auth check error:', error);
                    set({
                        user: null,
                        isAuthenticated: false,
                        isLoading: false
                    });
                }
            },
        }),
        {
            name: 'user-storage',
            partialize: (state) => ({ user: state.user }),
        }
    )
);

