'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/stores/userStore';
import { AnimatedBackground, Card, Button, Input } from '@/components/ui';
import { motion } from 'framer-motion';

export default function LoginPage() {
    const router = useRouter();
    const { login, isLoggingIn } = useUserStore();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!username || !password) {
            setError('Please enter username and password');
            return;
        }

        const success = await login(username, password);

        if (success) {
            router.push('/lobby');
        } else {
            setError('Invalid username or password');
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center px-4 py-8 relative">
            <AnimatedBackground />

            {/* Login Card */}
            <motion.div
                className="relative z-10 w-full max-w-md"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
            >
                <Card variant="elevated" className="shadow-glow-lg">
                    {/* Header */}
                    <motion.div
                        className="text-center mb-8"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-3xl shadow-lg">
                            🔐
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold gradient-text mb-2">
                            Admin Login
                        </h1>
                        <p className="text-slate-400 text-sm">
                            Enter administration panel
                        </p>
                    </motion.div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Error Message */}
                        {error && (
                            <motion.div
                                className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                {error}
                            </motion.div>
                        )}

                        <Input
                            label="Username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter your username"
                            autoComplete="username"
                            disabled={isLoggingIn}
                        />

                        <Input
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            disabled={isLoggingIn}
                        />

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            loading={isLoggingIn}
                            variant="primary"
                            size="lg"
                            className="w-full mt-6"
                        >
                            Sign In
                        </Button>
                    </form>

                    {/* Back to Home */}
                    <motion.div
                        className="mt-6 text-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <a
                            href="/"
                            className="text-sm text-slate-400 hover:text-primary-400 transition-colors inline-flex items-center gap-1"
                        >
                            ← Back to home
                        </a>
                    </motion.div>
                </Card>
            </motion.div>
        </main>
    );
}
