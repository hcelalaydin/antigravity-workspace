import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST - Player votes for a card
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
                    include: {
                        submissions: true,
                        votes: true,
                    },
                },
            },
        });

        if (!room || room.status !== 'PLAYING') {
            return NextResponse.json({ success: false, error: 'Game not found' }, { status: 404 });
        }

        const currentRound = room.gameRounds[0];
        if (!currentRound || currentRound.phase !== 'VOTING') {
            return NextResponse.json({ success: false, error: 'Not voting phase' }, { status: 400 });
        }

        const player = room.players.find((p) => p.userId === user.id);
        if (!player) {
            return NextResponse.json({ success: false, error: 'Not in game' }, { status: 403 });
        }

        // Storyteller can't vote
        if (currentRound.storytellerPlayerId === player.id) {
            return NextResponse.json({ success: false, error: 'Storyteller cannot vote' }, { status: 400 });
        }

        // Check if already voted
        const existingVote = currentRound.votes.find((v) => v.playerId === player.id);
        if (existingVote) {
            return NextResponse.json({ success: false, error: 'Already voted' }, { status: 400 });
        }

        // Can't vote for own card
        const ownSubmission = currentRound.submissions.find((s) => s.playerId === player.id);
        if (ownSubmission && ownSubmission.cardId === cardId) {
            return NextResponse.json({ success: false, error: 'Cannot vote for own card' }, { status: 400 });
        }

        // Verify card was submitted and get submission
        const targetSubmission = currentRound.submissions.find((s) => s.cardId === cardId);
        if (!targetSubmission) {
            return NextResponse.json({ success: false, error: 'Invalid card' }, { status: 400 });
        }

        // Create vote
        await prisma.vote.create({
            data: {
                roundId: currentRound.id,
                playerId: player.id,
                submissionId: targetSubmission.id,
                cardId,
            },
        });

        // Check if all non-storyteller players have voted
        const nonStorytellerPlayers = room.players.filter(
            (p) => p.id !== currentRound.storytellerPlayerId
        );
        const voteCount = currentRound.votes.length + 1;

        console.log(`[Vote] Player ${player.username} voted. Total votes: ${voteCount}/${nonStorytellerPlayers.length}`);

        if (voteCount >= nonStorytellerPlayers.length) {
            console.log('[Vote] All votes received. Calculating scores and moving to RESULTS.');
            // Calculate scores and move to results
            await calculateScores(currentRound.id, room.players, currentRound.storytellerPlayerId);

            await prisma.gameRound.update({
                where: { id: currentRound.id },
                data: { phase: 'RESULTS' },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Vote error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

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
    const votes = round.votes;

    // Count votes for storyteller's card
    const votesForStoryteller = votes.filter((v) => v.cardId === storytellerCardId).length;
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

        votes.forEach((vote) => {
            if (vote.cardId === storytellerCardId) {
                playerPoints[vote.playerId] += 3;
            }
        });
    }

    // Bonus points for votes on your card (if not storyteller)
    round.submissions.forEach((submission) => {
        if (!submission.isStoryteller) {
            const votesOnThisCard = votes.filter((v) => v.cardId === submission.cardId).length;
            playerPoints[submission.playerId] += votesOnThisCard;
        }
    });

    // Update player scores
    for (const [playerId, points] of Object.entries(playerPoints)) {
        await prisma.player.update({
            where: { id: playerId },
            data: { score: { increment: points } },
        });
    }
}
