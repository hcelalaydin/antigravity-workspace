import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { safeJsonParse } from '@/lib/utils';

// POST - Player submits a card
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
        const { cardId } = body;

        if (!cardId) {
            return NextResponse.json({ success: false, error: 'Card is required' }, { status: 400 });
        }

        const room = await prisma.room.findUnique({
            where: { code: code.toUpperCase() },
            include: {
                players: true,
                gameRounds: {
                    orderBy: { roundNumber: 'desc' },
                    take: 1,
                    include: { submissions: true },
                },
            },
        });

        if (!room || room.status !== 'PLAYING') {
            return NextResponse.json({ success: false, error: 'Game not found' }, { status: 404 });
        }

        const currentRound = room.gameRounds[0];
        if (!currentRound || currentRound.phase !== 'PLAYER_SUBMISSION') {
            return NextResponse.json({ success: false, error: 'Not submission phase' }, { status: 400 });
        }

        const player = room.players.find((p) => p.userId === user.id);
        if (!player) {
            return NextResponse.json({ success: false, error: 'Not in game' }, { status: 403 });
        }

        // Storyteller can't submit again
        if (currentRound.storytellerPlayerId === player.id) {
            return NextResponse.json({ success: false, error: 'Storyteller cannot submit' }, { status: 400 });
        }

        // Check if already submitted
        const existing = currentRound.submissions.find((s) => s.playerId === player.id);
        if (existing) {
            return NextResponse.json({ success: false, error: 'Already submitted' }, { status: 400 });
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
                isStoryteller: false,
            },
        });

        // Check if all players have submitted (storyteller + other players)
        // Re-fetch submissions to get accurate count
        const allSubmissions = await prisma.submission.count({
            where: { roundId: currentRound.id },
        });

        // All players should have submitted (storyteller already submitted, now all others)
        if (allSubmissions >= room.players.length) {
            console.log(`[Submit] All ${allSubmissions} submissions received. Moving to VOTING phase.`);
            // Move to voting phase
            await prisma.gameRound.update({
                where: { id: currentRound.id },
                data: { phase: 'VOTING' },
            });
        } else {
            console.log(`[Submit] Submission received. Total: ${allSubmissions}/${room.players.length}`);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Submit card error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
