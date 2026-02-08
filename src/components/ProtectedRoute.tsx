'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUserStore } from '@/stores/userStore';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isAuthenticated, checkAuth } = useUserStore();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const doCheck = async () => {
            await checkAuth();
            setIsChecking(false);
        };
        doCheck();
    }, [checkAuth]);

    useEffect(() => {
        // Only redirect after auth check is complete
        if (!isChecking) {
            if (!isAuthenticated) {
                router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
            } else if (requireAdmin && user?.role !== 'ADMIN') {
                router.push('/lobby');
            }
        }
    }, [isChecking, isAuthenticated, user, requireAdmin, router, pathname]);

    // Show loading while checking
    if (isChecking) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-slate-400">Loading...</p>
                </div>
            </div>
        );
    }

    // Not authenticated - show nothing while redirecting
    if (!isAuthenticated) {
        return null;
    }

    // Not admin when required - show nothing while redirecting
    if (requireAdmin && user?.role !== 'ADMIN') {
        return null;
    }

    return <>{children}</>;
}

