import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { safeJsonParse } from '@/lib/utils';

// Player colors for visual identification
const PLAYER_COLORS = [
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#06B6D4', // Cyan
    '#F97316', // Orange
];

// GET - Get game state
export async function GET(
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
                host: { select: { id: true, username: true } },
                players: {
                    include: {
                        user: { select: { id: true, username: true } },
                    },
                    orderBy: { joinedAt: 'asc' }, // Consistent order for color assignment
                },
                gameRounds: {
                    orderBy: { roundNumber: 'desc' },
                    take: 1,
                    include: {
                        submissions: {
                            include: {
                                card: { select: { id: true, imageUrl: true } },
                                player: {
                                    include: {
                                        user: { select: { id: true, username: true } },
                                    },
                                },
                            },
                            orderBy: { createdAt: 'asc' }, // Consistent order - no shuffle
                        },
                        votes: {
                            include: {
                                player: {
                                    include: {
                                        user: { select: { id: true, username: true } },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!room) {
            return NextResponse.json({ success: false, error: 'Game not found' }, { status: 404 });
        }

        if (room.status !== 'PLAYING' && room.status !== 'FINISHED') {
            return NextResponse.json({ success: false, error: 'Game not in progress' }, { status: 400 });
        }

        const currentRound = room.gameRounds[0];
        const currentPlayer = room.players.find((p) => p.userId === user.id);

        if (!currentPlayer) {
            return NextResponse.json({ success: false, error: 'Not in game' }, { status: 403 });
        }

        // Get player's hand
        const handCardIds: string[] = safeJsonParse(currentPlayer.handCardIds || '[]', []);
        const handCards = await prisma.card.findMany({
            where: { id: { in: handCardIds } },
            select: { id: true, imageUrl: true },
        });

        // Create player color map
        const playerColorMap: Record<string, { color: string; initial: string; username: string }> = {};
        room.players.forEach((p, index) => {
            playerColorMap[p.id] = {
                color: PLAYER_COLORS[index % PLAYER_COLORS.length],
                initial: p.user.username.charAt(0).toUpperCase(),
                username: p.user.username,
            };
        });

        // Get submitted cards with voter info (only during voting/results)
        let submittedCards: {
            id: string;
            imageUrl: string;
            submitterId: string;
            votes: { playerId: string; color: string; initial: string; username: string }[];
        }[] = [];

        if (currentRound && ['VOTING', 'RESULTS'].includes(currentRound.phase)) {
            // Sort by cardId for consistent ordering
            const sortedSubmissions = [...currentRound.submissions].sort((a, b) =>
                a.cardId.localeCompare(b.cardId)
            );

            console.log(`[GET Game] Found ${sortedSubmissions.length} submissions for round ${currentRound.id}`);
            console.log(`[GET Game] Submissions:`, sortedSubmissions.map(s => ({
                cardId: s.cardId,
                playerId: s.playerId,
                hasCard: !!s.card,
                imageUrl: s.card?.imageUrl?.substring(0, 50)
            })));

            submittedCards = sortedSubmissions
                .filter(s => s.card && s.card.imageUrl) // Filter out any submissions without valid card data
                .map((s) => {
                    // Find votes for this card
                    const cardVotes = currentRound.votes
                        .filter((v: any) => v.cardId === s.cardId)
                        .map((v: any) => ({
                            playerId: v.playerId,
                            ...playerColorMap[v.playerId],
                        }));

                    return {
                        id: s.cardId,
                        imageUrl: s.card.imageUrl,
                        submitterId: s.playerId,
                        votes: cardVotes,
                    };
                });

            console.log(`[GET Game] Returning ${submittedCards.length} cards to client`);
        }

        // Check if current user has submitted/voted
        const mySubmission = currentRound?.submissions.find(
            (s) => s.playerId === currentPlayer.id
        );
        const myVote = currentRound?.votes.find((v) => v.playerId === currentPlayer.id);

        // Calculate round scores if in RESULTS phase
        const roundScores: Record<string, { points: number; breakdown: string[] }> = {};

        if (currentRound && currentRound.phase === 'RESULTS' && currentRound.storytellerCardId) {
            const votes = currentRound.votes;
            const storytellerCardId = currentRound.storytellerCardId;
            const storytellerId = currentRound.storytellerPlayerId;

            const votesForStoryteller = votes.filter((v) => v.cardId === storytellerCardId).length;
            const totalVoters = room.players.length - 1; // Excluding storyteller

            // Initialize scores
            room.players.forEach(p => {
                roundScores[p.id] = { points: 0, breakdown: [] };
            });

            // Storyteller scoring logic
            if (votesForStoryteller === 0 || votesForStoryteller === totalVoters) {
                // Nobody or everybody found it - storyteller 0, others 2
                room.players.forEach((p) => {
                    if (p.id !== storytellerId) {
                        roundScores[p.id].points += 2;
                        roundScores[p.id].breakdown.push('+2 Everyone/Nobody found storyteller');
                    } else {
                        roundScores[p.id].breakdown.push('+0 Everyone/Nobody found your card');
                    }
                });
            } else {
                // Storyteller gets 3
                if (roundScores[storytellerId]) {
                    roundScores[storytellerId].points += 3;
                    roundScores[storytellerId].breakdown.push('+3 Some players found your card');
                }

                // Players who found it get 3
                votes.filter(v => v.cardId === storytellerCardId).forEach(vote => {
                    if (roundScores[vote.playerId]) {
                        roundScores[vote.playerId].points += 3;
                        roundScores[vote.playerId].breakdown.push('+3 Found storyteller\'s card');
                    }
                });
            }

            // Bonus points for votes on own card (non-storyteller)
            currentRound.submissions.forEach((submission) => {
                if (submission.playerId !== storytellerId) {
                    const votesOnThisCard = votes.filter((v) => v.cardId === submission.cardId).length;
                    if (votesOnThisCard > 0) {
                        if (roundScores[submission.playerId]) {
                            roundScores[submission.playerId].points += votesOnThisCard;
                            roundScores[submission.playerId].breakdown.push(`+${votesOnThisCard} Bonus for ${votesOnThisCard} vote(s)`);
                        }
                    }
                }
            });
        }

        // Transform players with colors and round scores
        const players = room.players.map((p, index) => ({
            id: p.id,
            odour: p.userId,
            username: p.user.username,
            score: p.score,
            isHost: p.userId === room.hostId,
            isStoryteller: currentRound?.storytellerPlayerId === p.id,
            color: PLAYER_COLORS[index % PLAYER_COLORS.length],
            initial: p.user.username.charAt(0).toUpperCase(),
            roundPoints: roundScores[p.id]?.points || 0,
            roundBreakdown: roundScores[p.id]?.breakdown || [],
        }));

        return NextResponse.json({
            success: true,
            game: {
                id: room.id,
                code: room.code,
                name: room.name,
                status: room.status,
                hostId: room.hostId,
                pointsToWin: room.pointsToWin,
                currentRound: room.currentRound,
                players,
                round: currentRound
                    ? {
                        id: currentRound.id,
                        roundNumber: currentRound.roundNumber,
                        storytellerPlayerId: currentRound.storytellerPlayerId,
                        phase: currentRound.phase,
                        clue: currentRound.clue,
                        storytellerCardId: currentRound.storytellerCardId,
                    }
                    : null,
                myHand: handCards,
                submittedCards,
                hasSubmitted: !!mySubmission,
                hasVoted: !!myVote,
                mySubmittedCardId: mySubmission?.cardId,
                myVotedCardId: myVote?.cardId,
            },
        });
    } catch (error) {
        console.error('Get game error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
