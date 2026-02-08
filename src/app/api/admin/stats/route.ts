import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        await requireAdmin();

        const [users, cards, rooms] = await Promise.all([
            prisma.user.count(),
            prisma.card.count({ where: { isActive: true } }),
            prisma.room.count({ where: { status: { in: ['WAITING', 'PLAYING'] } } }),
        ]);

        return NextResponse.json({
            success: true,
            stats: { users, cards, rooms },
        });
    } catch (error) {
        if (error instanceof Error && error.message === 'Forbidden') {
            return NextResponse.json(
                { success: false, error: 'Forbidden' },
                { status: 403 }
            );
        }
        console.error('Stats error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
