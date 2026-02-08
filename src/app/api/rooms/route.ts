import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { generateRoomCode } from '@/lib/utils';

// GET - List rooms (user's rooms or all waiting rooms)
export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const filter = searchParams.get('filter') || 'my'; // 'my' or 'available'

        let rooms;

        if (filter === 'available') {
            // Get all waiting rooms
            rooms = await prisma.room.findMany({
                where: { status: 'WAITING' },
                include: {
                    host: { select: { id: true, username: true } },
                    players: { select: { id: true, userId: true, isReady: true } },
                },
                orderBy: { createdAt: 'desc' },
                take: 20,
            });
        } else {
            // Get user's rooms (as host or player)
            rooms = await prisma.room.findMany({
                where: {
                    OR: [
                        { hostId: user.id },
                        { players: { some: { userId: user.id } } },
                    ],
                    status: { in: ['WAITING', 'PLAYING'] },
                },
                include: {
                    host: { select: { id: true, username: true } },
                    players: { select: { id: true, userId: true, isReady: true } },
                },
                orderBy: { createdAt: 'desc' },
            });
        }

        // Transform for client
        const transformedRooms = rooms.map((room) => ({
            id: room.id,
            code: room.code,
            name: room.name,
            status: room.status,
            hostId: room.hostId,
            hostName: room.host.username,
            playerCount: room.players.length,
            maxPlayers: room.maxPlayers,
            pointsToWin: room.pointsToWin,
            createdAt: room.createdAt,
        }));

        return NextResponse.json({ success: true, rooms: transformedRooms });
    } catch (error) {
        console.error('Get rooms error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

// POST - Create a new room
export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, maxPlayers = 8, pointsToWin = 30 } = body;

        // Validate
        if (!name || name.trim().length < 2) {
            return NextResponse.json(
                { success: false, error: 'Room name must be at least 2 characters' },
                { status: 400 }
            );
        }

        // Generate unique room code
        let code = generateRoomCode();
        let attempts = 0;
        while (await prisma.room.findUnique({ where: { code } })) {
            code = generateRoomCode();
            attempts++;
            if (attempts > 10) {
                return NextResponse.json(
                    { success: false, error: 'Failed to generate unique room code' },
                    { status: 500 }
                );
            }
        }

        // Create room and add host as first player
        const room = await prisma.room.create({
            data: {
                code,
                name: name.trim(),
                hostId: user.id,
                maxPlayers: Math.min(Math.max(maxPlayers, 3), 8), // 3-8 players
                pointsToWin: Math.min(Math.max(pointsToWin, 10), 100), // 10-100 points
                players: {
                    create: {
                        userId: user.id,
                        isReady: false,
                    },
                },
            },
            include: {
                host: { select: { id: true, username: true } },
                players: { select: { id: true, userId: true, isReady: true } },
            },
        });

        return NextResponse.json({
            success: true,
            room: {
                id: room.id,
                code: room.code,
                name: room.name,
                status: room.status,
                hostId: room.hostId,
                hostName: room.host.username,
                playerCount: room.players.length,
                maxPlayers: room.maxPlayers,
                pointsToWin: room.pointsToWin,
            },
        });
    } catch (error) {
        console.error('Create room error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
