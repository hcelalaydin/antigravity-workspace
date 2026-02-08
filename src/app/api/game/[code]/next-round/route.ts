import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { safeJsonParse } from '@/lib/utils';

// POST - Move to next round
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    try {
        const { code } = await params;
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const room = await prisma.room.findUnique({
            where: { code: code.toUpperCase() },
            include: {
                players: true,
                gameRounds: {
                    orderBy: { roundNumber: 'desc' },
                    take: 1,
                },
            },
        });

        if (!room || room.status !== 'PLAYING') {
            return NextResponse.json({ success: false, error: 'Game not found' }, { status: 404 });
        }

        // Only host can advance
        if (room.hostId !== user.id) {
            return NextResponse.json({ success: false, error: 'Only host can advance' }, { status: 403 });
        }

        const currentRound = room.gameRounds[0];
        if (!currentRound || currentRound.phase !== 'RESULTS') {
            return NextResponse.json({ success: false, error: 'Not results phase' }, { status: 400 });
        }

        // Check if anyone won
        const winner = room.players.find((p) => p.score >= room.pointsToWin);
        if (winner) {
            await prisma.room.update({
                where: { id: room.id },
                data: {
                    status: 'FINISHED',
                    endedAt: new Date(),
                },
            });
            return NextResponse.json({ success: true, gameEnded: true, winner: winner.id });
        }

        // Deal new cards to each player
        const deckCardIds: string[] = safeJsonParse(room.deckCardIds || '[]', []);
        let deckIndex = 0;

        for (const player of room.players) {
            const handCardIds: string[] = safeJsonParse(player.handCardIds || '[]', []);

            // Need to refill to cardsPerPlayer
            while (handCardIds.length < room.cardsPerPlayer && deckIndex < deckCardIds.length) {
                handCardIds.push(deckCardIds[deckIndex]);
                deckIndex++;
            }

            await prisma.player.update({
                where: { id: player.id },
                data: { handCardIds: JSON.stringify(handCardIds) },
            });
        }

        // Update deck
        const remainingDeck = deckCardIds.slice(deckIndex);

        // Rotate storyteller
        const playerIds = room.players.map((p) => p.id);
        const currentStorytellerIndex = playerIds.indexOf(currentRound.storytellerPlayerId);
        const nextStorytellerIndex = (currentStorytellerIndex + 1) % playerIds.length;
        const nextStorytellerId = playerIds[nextStorytellerIndex];

        // Create new round
        await prisma.gameRound.create({
            data: {
                roomId: room.id,
                roundNumber: room.currentRound + 1,
                storytellerPlayerId: nextStorytellerId,
                phase: 'STORYTELLER_TURN',
            },
        });

        // Update room
        await prisma.room.update({
            where: { id: room.id },
            data: {
                currentRound: room.currentRound + 1,
                deckCardIds: JSON.stringify(remainingDeck),
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Next round error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
