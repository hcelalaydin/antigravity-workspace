import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST - Toggle ready status
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { code } = await params;

        const room = await prisma.room.findUnique({
            where: { code: code.toUpperCase() },
            include: { players: true },
        });

        if (!room) {
            return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
        }

        if (room.status !== 'WAITING') {
            return NextResponse.json({ success: false, error: 'Game already started' }, { status: 400 });
        }

        // Find player
        const player = room.players.find((p) => p.userId === user.id);
        if (!player) {
            return NextResponse.json({ success: false, error: 'Not in room' }, { status: 400 });
        }

        // Host doesn't need to ready
        if (room.hostId === user.id) {
            return NextResponse.json({ success: true, isReady: true });
        }

        // Toggle ready status
        const updated = await prisma.player.update({
            where: { id: player.id },
            data: { isReady: !player.isReady },
        });

        return NextResponse.json({ success: true, isReady: updated.isReady });
    } catch (error) {
        console.error('Ready toggle error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
