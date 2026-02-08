import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { safeJsonParse } from '@/lib/utils';

// POST - Storyteller submits card and clue
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

        const body = await request.json();
        const { cardId, clue } = body;

        if (!cardId || !clue?.trim()) {
            return NextResponse.json(
                { success: false, error: 'Card and clue are required' },
                { status: 400 }
            );
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

        const currentRound = room.gameRounds[0];
        if (!currentRound || currentRound.phase !== 'STORYTELLER_TURN') {
            return NextResponse.json({ success: false, error: 'Not storyteller turn' }, { status: 400 });
        }

        const player = room.players.find((p) => p.userId === user.id);
        if (!player || currentRound.storytellerPlayerId !== player.id) {
            return NextResponse.json({ success: false, error: 'You are not the storyteller' }, { status: 403 });
        }

        // Verify card is in hand
        const handCardIds: string[] = safeJsonParse(player.handCardIds || '[]', []);
        if (!handCardIds.includes(cardId)) {
            return NextResponse.json({ success: false, error: 'Card not in hand' }, { status: 400 });
        }

        // Remove card from hand
        const newHand = handCardIds.filter((id) => id !== cardId);
        await prisma.player.update({
            where: { id: player.id },
            data: { handCardIds: JSON.stringify(newHand) },
        });

        // Create submission
        await prisma.submission.create({
            data: {
                roundId: currentRound.id,
                playerId: player.id,
                cardId,
                isStoryteller: true,
            },
        });

        // Update round
        await prisma.gameRound.update({
            where: { id: currentRound.id },
            data: {
                clue: clue.trim(),
                storytellerCardId: cardId,
                phase: 'PLAYER_SUBMISSION',
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Storyteller submit error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
