import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - Get room by code
export async function GET(
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
            include: {
                host: { select: { id: true, username: true } },
                players: {
                    include: {
                        user: { select: { id: true, username: true } },
                    },
                    orderBy: { joinedAt: 'asc' },
                },
            },
        });

        if (!room) {
            return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
        }

        // Transform players
        const players = room.players.map((p) => ({
            id: p.id,
            userId: p.userId,
            username: p.user.username,
            isReady: p.isReady,
            isOnline: p.isOnline,
            score: p.score,
            isHost: p.userId === room.hostId,
        }));

        return NextResponse.json({
            success: true,
            room: {
                id: room.id,
                code: room.code,
                name: room.name,
                status: room.status,
                hostId: room.hostId,
                hostName: room.host.username,
                maxPlayers: room.maxPlayers,
                pointsToWin: room.pointsToWin,
                cardsPerPlayer: room.cardsPerPlayer,
                currentRound: room.currentRound,
                players,
                createdAt: room.createdAt,
            },
        });
    } catch (error) {
        console.error('Get room error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

// POST - Join room by code
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
            include: {
                players: true,
            },
        });

        if (!room) {
            return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
        }

        if (room.status !== 'WAITING') {
            return NextResponse.json(
                { success: false, error: 'Game has already started' },
                { status: 400 }
            );
        }

        // Check if already in room
        const existingPlayer = room.players.find((p) => p.userId === user.id);
        if (existingPlayer) {
            return NextResponse.json({
                success: true,
                message: 'Already in room',
                room: { code: room.code },
            });
        }

        // Check if room is full
        if (room.players.length >= room.maxPlayers) {
            return NextResponse.json({ success: false, error: 'Room is full' }, { status: 400 });
        }

        // Add player to room
        await prisma.player.create({
            data: {
                userId: user.id,
                roomId: room.id,
                isReady: false,
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Joined room',
            room: { code: room.code },
        });
    } catch (error) {
        console.error('Join room error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE - Leave room
export async function DELETE(
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

        // Find player
        const player = room.players.find((p) => p.userId === user.id);
        if (!player) {
            return NextResponse.json({ success: false, error: 'Not in room' }, { status: 400 });
        }

        // If host leaves, either transfer or close room
        if (room.hostId === user.id) {
            if (room.players.length <= 1) {
                // Close room if only host
                await prisma.room.update({
                    where: { id: room.id },
                    data: { status: 'ABANDONED' },
                });
            } else {
                // Transfer host to next player
                const nextHost = room.players.find((p) => p.userId !== user.id);
                if (nextHost) {
                    await prisma.room.update({
                        where: { id: room.id },
                        data: { hostId: nextHost.userId },
                    });
                }
            }
        }

        // Remove player
        await prisma.player.delete({ where: { id: player.id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Leave room error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
