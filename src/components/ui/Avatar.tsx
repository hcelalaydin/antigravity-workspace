'use client';

import { clsx } from 'clsx';

interface AvatarProps {
    name: string;
    color?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showRing?: boolean;
    online?: boolean;
    className?: string;
}

const COLORS = [
    '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
    '#eab308', '#22c55e', '#14b8a6', '#06b6d4',
    '#3b82f6', '#6366f1',
];

function getColorFromName(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return COLORS[Math.abs(hash) % COLORS.length];
}

function getInitial(name: string): string {
    return name.charAt(0).toUpperCase();
}

export function Avatar({
    name,
    color,
    size = 'md',
    showRing = false,
    online = false,
    className
}: AvatarProps) {
    const bgColor = color || getColorFromName(name);

    const sizes = {
        sm: 'w-8 h-8 text-sm',
        md: 'w-10 h-10 text-base',
        lg: 'w-12 h-12 text-lg',
        xl: 'w-16 h-16 text-2xl',
    };

    return (
        <div
            className={clsx(
                'avatar relative',
                sizes[size],
                showRing && 'avatar-ring',
                online && 'avatar-online',
                className
            )}
            style={{ background: `linear-gradient(135deg, ${bgColor} 0%, ${bgColor}dd 100%)` }}
        >
            {getInitial(name)}
        </div>
    );
}

export { COLORS, getColorFromName, getInitial };
