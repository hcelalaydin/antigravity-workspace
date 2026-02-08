import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST - Force advance to next phase (Debug/Emergency tool)
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
                gameRounds: {
                    orderBy: { roundNumber: 'desc' },
                    take: 1,
                    include: {
                        submissions: true,
                        votes: true,
                    }
                },
                players: true,
            },
        });

        if (!room) {
            return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
        }

        // Only host can force next phase
        if (room.hostId !== user.id) {
            return NextResponse.json({ success: false, error: 'Only host can force next phase' }, { status: 403 });
        }

        const currentRound = room.gameRounds[0];
        if (!currentRound) {
            return NextResponse.json({ success: false, error: 'No active round' }, { status: 400 });
        }

        let nextPhase = '';

        switch (currentRound.phase) {
            case 'STORYTELLER_TURN':
                nextPhase = 'PLAYER_SUBMISSION';
                break;
            case 'PLAYER_SUBMISSION':
                nextPhase = 'VOTING';
                break;
            case 'VOTING':
                nextPhase = 'RESULTS';
                // Trigger score calculation manually if needed, but for force next we might just skip it or try to run it safely
                try {
                    await calculateScores(currentRound.id, room.players, currentRound.storytellerPlayerId);
                } catch (e) {
                    console.error('Force next: Score calculation failed, proceeding anyway', e);
                }
                break;
            case 'RESULTS':
                // For results, use the next-round endpoint logic usually, but here we just return error saying use "Next Round" button
                return NextResponse.json({ success: false, error: 'Use "Next Round" button for RESULTS phase' }, { status: 400 });
            default:
                return NextResponse.json({ success: false, error: 'Unknown phase' }, { status: 400 });
        }

        if (nextPhase) {
            await prisma.gameRound.update({
                where: { id: currentRound.id },
                data: { phase: nextPhase },
            });
            console.log(`[Force Next] Advanced round ${currentRound.id} from ${currentRound.phase} to ${nextPhase}`);
        }

        return NextResponse.json({ success: true, nextPhase });
    } catch (error) {
        console.error('Force next error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

// Copy of score calculation logic (should be shared in a util but for now duplicating for safety)
async function calculateScores(
    roundId: string,
    players: { id: string; score: number }[],
    storytellerId: string
) {
    const round = await prisma.gameRound.findUnique({
        where: { id: roundId },
        include: {
            submissions: true,
            votes: true,
        },
    });

    if (!round) return;

    const storytellerCardId = round.storytellerCardId;
    if (!storytellerCardId) return;

    const votes = round.votes;

    // Count votes for storyteller's card
    const votesForStoryteller = votes.filter((v: any) => v.cardId === storytellerCardId).length;
    const totalVoters = players.length - 1; // Excluding storyteller

    const playerPoints: Record<string, number> = {};

    // Initialize points
    players.forEach((p) => (playerPoints[p.id] = 0));

    if (votesForStoryteller === 0 || votesForStoryteller === totalVoters) {
        // Nobody or everybody found it - storyteller gets 0, everyone else gets 2
        players.forEach((p) => {
            if (p.id !== storytellerId) {
                playerPoints[p.id] += 2;
            }
        });
    } else {
        // Some found it - storyteller gets 3, correct guessers get 3
        playerPoints[storytellerId] = 3;

        votes.forEach((vote: any) => {
            if (vote.cardId === storytellerCardId) {
                playerPoints[vote.playerId] += 3;
            }
        });
    }

    // Bonus points for votes on your card (if not storyteller)
    round.submissions.forEach((submission) => {
        // Only give bonus if NOT storyteller
        const isActuallyStoryteller = submission.playerId === storytellerId; // checking ID directly as submission.isStoryteller might be unreliable if schema mismatch
        if (!isActuallyStoryteller) {
            const votesOnThisCard = votes.filter((v: any) => v.cardId === submission.cardId).length;
            playerPoints[submission.playerId] += votesOnThisCard;
        }
    });

    // Update player scores
    for (const [playerId, points] of Object.entries(playerPoints)) {
        if (points > 0) {
            await prisma.player.update({
                where: { id: playerId },
                data: { score: { increment: points } },
            });
        }
    }
}
