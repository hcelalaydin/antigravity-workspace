import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { shuffleArray } from '@/lib/utils';

// POST - Start the game
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

        // Only host can start
        if (room.hostId !== user.id) {
            return NextResponse.json({ success: false, error: 'Only host can start' }, { status: 403 });
        }

        if (room.status !== 'WAITING') {
            return NextResponse.json({ success: false, error: 'Game already started' }, { status: 400 });
        }

        // Need at least 3 players
        if (room.players.length < 3) {
            return NextResponse.json(
                { success: false, error: 'Need at least 3 players' },
                { status: 400 }
            );
        }

        // Check all non-host players are ready
        const notReady = room.players.filter((p) => p.userId !== room.hostId && !p.isReady);
        if (notReady.length > 0) {
            return NextResponse.json(
                { success: false, error: 'Not all players are ready' },
                { status: 400 }
            );
        }

        // Get all active cards
        const cards = await prisma.card.findMany({
            where: { isActive: true },
            select: { id: true },
        });

        const totalCardsNeeded = room.players.length * room.cardsPerPlayer + 20; // Extra buffer
        if (cards.length < totalCardsNeeded) {
            return NextResponse.json(
                { success: false, error: `Not enough cards. Need ${totalCardsNeeded}, have ${cards.length}` },
                { status: 400 }
            );
        }

        // Shuffle and distribute cards
        const shuffledCardIds = shuffleArray(cards.map((c) => c.id));
        const playerIds = room.players.map((p) => p.id);

        // Deal cards to players
        let cardIndex = 0;
        for (const player of room.players) {
            const handCards = shuffledCardIds.slice(cardIndex, cardIndex + room.cardsPerPlayer);
            cardIndex += room.cardsPerPlayer;

            await prisma.player.update({
                where: { id: player.id },
                data: { handCardIds: JSON.stringify(handCards) },
            });
        }

        // Remaining cards form the deck
        const deckCards = shuffledCardIds.slice(cardIndex);

        // Select first storyteller (random)
        const firstStoryteller = playerIds[Math.floor(Math.random() * playerIds.length)];

        // Create first round
        await prisma.gameRound.create({
            data: {
                roomId: room.id,
                roundNumber: 1,
                storytellerPlayerId: firstStoryteller,
                phase: 'STORYTELLER_TURN',
            },
        });

        // Update room status
        await prisma.room.update({
            where: { id: room.id },
            data: {
                status: 'PLAYING',
                currentRound: 1,
                deckCardIds: JSON.stringify(deckCards),
                startedAt: new Date(),
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Start game error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
