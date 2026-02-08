'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/stores/userStore';
import ProtectedRoute from '@/components/ProtectedRoute';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

// Animation Variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    },
    exit: { opacity: 0 }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { type: 'spring', stiffness: 300, damping: 24 }
    }
};

const cardVariants = {
    hidden: { scale: 0.8, opacity: 0, rotateY: 90 },
    visible: {
        scale: 1,
        opacity: 1,
        rotateY: 0,
        transition: { type: 'spring', stiffness: 200, damping: 20 }
    },
    hover: {
        scale: 1.05,
        y: -10,
        boxShadow: '0 0 25px rgba(139, 92, 246, 0.5)',
        transition: { type: 'spring', stiffness: 400, damping: 10 }
    },
    tap: { scale: 0.95 }
};

interface Vote {
    playerId: string;
    color: string;
    initial: string;
    username: string;
}

interface Card {
    id: string;
    imageUrl: string;
    submitterId?: string;
    votes?: Vote[];
}

interface Player {
    id: string;
    odour: string;
    username: string;
    score: number;
    isHost: boolean;
    isStoryteller: boolean;
    color: string;
    initial: string;
    roundPoints: number;
    roundBreakdown: string[];
}

interface RoundData {
    id: string;
    roundNumber: number;
    storytellerPlayerId: string;
    phase: 'STORYTELLER_TURN' | 'PLAYER_SUBMISSION' | 'VOTING' | 'RESULTS';
    clue?: string;
    storytellerCardId?: string;
}

interface GameData {
    id: string;
    code: string;
    name: string;
    status: string;
    hostId: string;
    pointsToWin: number;
    currentRound: number;
    players: Player[];
    round: RoundData | null;
    myHand: Card[];
    submittedCards: Card[];
    hasSubmitted: boolean;
    hasVoted: boolean;
    mySubmittedCardId?: string;
    myVotedCardId?: string;
    winnerId?: string;
}

export default function GamePage({ params }: { params: { code: string } }) {
    const router = useRouter();
    const { user } = useUserStore();
    const [game, setGame] = useState<GameData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedCard, setSelectedCard] = useState<string | null>(null);
    const [clue, setClue] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [errorCount, setErrorCount] = useState(0);

    const fetchGame = useCallback(async () => {
        try {
            const res = await fetch(`/api/game/${params.code}`);
            const data = await res.json();

            if (data.success) {
                setGame(data.game);
                setError('');
                setErrorCount(0); // Reset on success
            } else {
                // Only show error after multiple failures
                setErrorCount(prev => prev + 1);
                if (errorCount > 2) {
                    setError(data.error || 'Game not found');
                }
            }
        } catch (err) {
            // Silent retry for network errors - only show after 3 consecutive failures
            setErrorCount(prev => prev + 1);
            console.warn('[Game] Fetch error (retry pending):', err);
            if (errorCount > 2) {
                setError('Connection lost. Retrying...');
            }
        } finally {
            setLoading(false);
        }
    }, [params.code, errorCount]);

    useEffect(() => {
        fetchGame();
        const interval = setInterval(fetchGame, 2000);
        return () => clearInterval(interval);
    }, [fetchGame]);

    const isStoryteller = game?.round?.storytellerPlayerId === game?.players.find(p => p.odour === user?.id)?.id;

    const handleStorytellerSubmit = async () => {
        if (!selectedCard || !clue.trim()) return;
        setSubmitting(true);

        try {
            const res = await fetch(`/api/game/${params.code}/storyteller`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cardId: selectedCard, clue: clue.trim() }),
            });
            const data = await res.json();
            if (data.success) {
                setSelectedCard(null);
                setClue('');
                fetchGame();
            } else {
                alert(data.error || 'Failed to submit');
            }
        } catch (err) {
            alert('Failed to submit');
        } finally {
            setSubmitting(false);
        }
    };

    const handlePlayerSubmit = async () => {
        if (!selectedCard) return;
        setSubmitting(true);

        try {
            const res = await fetch(`/api/game/${params.code}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cardId: selectedCard }),
            });
            const data = await res.json();
            if (data.success) {
                setSelectedCard(null);
                fetchGame();
            } else {
                alert(data.error || 'Failed to submit');
            }
        } catch (err) {
            alert('Failed to submit');
        } finally {
            setSubmitting(false);
        }
    };

    const handleVote = async (cardId: string) => {
        if (game?.hasVoted) return;
        setSubmitting(true);

        try {
            const res = await fetch(`/api/game/${params.code}/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cardId }),
            });
            const data = await res.json();
            if (data.success) {
                fetchGame();
            } else {
                alert(data.error || 'Failed to vote');
            }
        } catch (err) {
            alert('Failed to vote');
        } finally {
            setSubmitting(false);
        }
    };

    const handleNextRound = async () => {
        try {
            const res = await fetch(`/api/game/${params.code}/next-round`, {
                method: 'POST',
            });
            const data = await res.json();
            if (data.success) {
                fetchGame();
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen flex items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass rounded-xl p-8 text-center max-w-sm w-full"
                    >
                        <div className="relative w-16 h-16 mx-auto mb-4">
                            <div className="absolute inset-0 border-4 border-primary-500/30 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2 font-cinzel">Loading Dream...</h2>
                        <p className="text-slate-400 text-sm">Preparing the realm of imagination</p>
                    </motion.div>
                </div>
            </ProtectedRoute>
        );
    }

    if (error || !game) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass rounded-xl p-8 text-center max-w-md w-full border-red-500/20"
                    >
                        <div className="text-4xl mb-4 animate-bounce">🌑</div>
                        <h2 className="text-2xl font-bold text-white mb-2 font-cinzel">Dream Not Found</h2>
                        <p className="text-slate-400 mb-6">{error || "The game you're looking for has vanished into the ether."}</p>
                        <button onClick={() => router.push('/lobby')} className="btn btn-primary px-8 py-3 w-full">
                            Return to Lobby
                        </button>
                    </motion.div>
                </div>
            </ProtectedRoute>
        );
    }

    if (game.status === 'FINISHED') {
        return (
            <ProtectedRoute>
                <GameEndView
                    players={game.players}
                    winnerId={game.winnerId}
                    onBackToLobby={() => router.push('/')}
                />
            </ProtectedRoute>
        );
    } // End of GameEndView check

    return (
        <ProtectedRoute>
            <motion.main
                className="min-h-screen p-4 sm:p-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                {/* Header */}
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-white">{game.name}</h1>
                        <p className="text-slate-400 text-sm">
                            Round {game.currentRound} • {game.round?.phase.replace('_', ' ')}
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-slate-400">🏆 {game.pointsToWin} to win</span>
                    </div>
                </header>

                {/* Scoreboard */}
                <div className="glass rounded-xl p-4 mb-6">
                    <h2 className="text-sm font-medium text-slate-400 mb-3">Scoreboard</h2>
                    <div className="flex flex-wrap gap-3">
                        {game.players.sort((a, b) => b.score - a.score).map((player) => (
                            <div
                                key={player.id}
                                className={`relative group flex items-center gap-2 px-3 py-2 rounded-lg transition-all cursor-pointer ${player.isStoryteller ? 'bg-primary-500/20 border border-primary-500/30' : 'bg-dream-surface/50 hover:bg-dream-surface/80'
                                    }`}
                            >
                                {/* Player color */}
                                <div
                                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                    style={{ backgroundColor: player.color }}
                                >
                                    {player.initial}
                                </div>
                                <span className="text-white font-medium">{player.username}</span>
                                <span className="text-primary-400 font-bold">{player.score}</span>

                                {/* Round Point Badge */}
                                {player.roundPoints > 0 && game.round?.phase === 'RESULTS' && (
                                    <span className="bg-green-500/20 text-green-400 text-xs px-1.5 py-0.5 rounded font-bold ml-1">
                                        +{player.roundPoints}
                                    </span>
                                )}

                                {player.isStoryteller && <span className="text-xs">📖</span>}

                                {/* Point Details Popup (Hover/Click) */}
                                <div className="absolute top-full left-0 mt-2 w-48 bg-gray-900/95 backdrop-blur border border-white/10 rounded-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-xl">
                                    <p className="text-xs font-bold text-slate-300 mb-1 border-b border-white/10 pb-1">
                                        {game.round?.phase === 'RESULTS' ? 'Round Results' : 'Stats'}
                                    </p>

                                    {game.round?.phase === 'RESULTS' && player.roundBreakdown && player.roundBreakdown.length > 0 ? (
                                        <ul className="space-y-1">
                                            {player.roundBreakdown.map((item, i) => (
                                                <li key={i} className="text-[10px] text-green-400 flex justify-between">
                                                    <span>{item.split(' ')[0]}</span>
                                                    <span className="text-slate-400 truncate ml-1">{item.substring(item.indexOf(' '))}</span>
                                                </li>
                                            ))}
                                            <li className="text-[10px] text-white border-t border-white/10 pt-1 mt-1 font-bold flex justify-between">
                                                <span>Total</span>
                                                <span>+{player.roundPoints}</span>
                                            </li>
                                        </ul>
                                    ) : (
                                        <p className="text-[10px] text-slate-500">No points this round yet</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Game Phase Content */}
                {game.round?.phase === 'STORYTELLER_TURN' && (
                    <StorytellerPhase
                        isStoryteller={isStoryteller}
                        hand={game.myHand}
                        selectedCard={selectedCard}
                        setSelectedCard={setSelectedCard}
                        clue={clue}
                        setClue={setClue}
                        onSubmit={handleStorytellerSubmit}
                        submitting={submitting}
                    />
                )}

                {game.round?.phase === 'PLAYER_SUBMISSION' && (
                    <SubmissionPhase
                        isStoryteller={isStoryteller}
                        clue={game.round.clue || ''}
                        hand={game.myHand}
                        selectedCard={selectedCard}
                        setSelectedCard={setSelectedCard}
                        onSubmit={handlePlayerSubmit}
                        submitting={submitting}
                        hasSubmitted={game.hasSubmitted}
                    />
                )}

                {game.round?.phase === 'VOTING' && (
                    <VotingPhase
                        isStoryteller={isStoryteller}
                        clue={game.round.clue || ''}
                        cards={game.submittedCards}
                        onVote={handleVote}
                        hasVoted={game.hasVoted}
                        mySubmittedCardId={game.mySubmittedCardId}
                        isHost={game.hostId === user?.id}
                        onForceNextPhase={async () => {
                            if (!confirm('Are you sure you want to force the next phase? This should only be used if the game is stuck.')) return;
                            try {
                                const response = await fetch(`/api/game/${params.code}/force-next`, {
                                    method: 'POST',
                                });
                                if (!response.ok) throw new Error('Failed to force next phase');
                            } catch (error) {
                                console.error('Force next phase error:', error);
                                alert('Failed to force next phase');
                            }
                        }}
                    />
                )}

                {game.round?.phase === 'RESULTS' && (
                    <ResultsPhase
                        cards={game.submittedCards}
                        clue={game.round.clue || ''}
                        storytellerCardId={game.round.storytellerCardId}
                        isHost={game.hostId === user?.id}
                        onNextRound={handleNextRound}
                    />
                )}
            </motion.main>
        </ProtectedRoute>
    );
}

// Storyteller Phase Component
function StorytellerPhase({
    isStoryteller,
    hand,
    selectedCard,
    setSelectedCard,
    clue,
    setClue,
    onSubmit,
    submitting,
}: {
    isStoryteller: boolean;
    hand: Card[];
    selectedCard: string | null;
    setSelectedCard: (id: string | null) => void;
    clue: string;
    setClue: (clue: string) => void;
    onSubmit: () => void;
    submitting: boolean;
}) {
    if (!isStoryteller) {
        return (
            <div className="glass rounded-xl p-8 text-center">
                <div className="text-4xl mb-4">⏳</div>
                <h2 className="text-xl font-bold text-white mb-2">Waiting for Storyteller</h2>
                <p className="text-slate-400">The storyteller is choosing a card and writing a clue...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="glass rounded-xl p-6">
                <h2 className="text-lg font-bold text-white mb-2">📖 You are the Storyteller!</h2>
                <p className="text-slate-400 text-sm mb-4">
                    Choose a card from your hand and write a clue for it. Make it creative but not too obvious!
                </p>

                <div className="mb-4">
                    <input
                        type="text"
                        value={clue}
                        onChange={(e) => setClue(e.target.value)}
                        placeholder="Write your clue here..."
                        className="input-base text-lg"
                        maxLength={100}
                    />
                </div>

                <button
                    onClick={onSubmit}
                    disabled={!selectedCard || !clue.trim() || submitting}
                    className="btn btn-primary w-full py-3"
                >
                    {submitting ? 'Submitting...' : 'Submit Card & Clue'}
                </button>
            </div>

            <HandDisplay
                cards={hand}
                selectedCard={selectedCard}
                onSelect={setSelectedCard}
                label="Select a card for your clue"
            />
        </div>
    );
}

// Submission Phase Component
function SubmissionPhase({
    isStoryteller,
    clue,
    hand,
    selectedCard,
    setSelectedCard,
    onSubmit,
    submitting,
    hasSubmitted,
}: {
    isStoryteller: boolean;
    clue: string;
    hand: Card[];
    selectedCard: string | null;
    setSelectedCard: (id: string | null) => void;
    onSubmit: () => void;
    submitting: boolean;
    hasSubmitted: boolean;
}) {
    if (isStoryteller) {
        return (
            <div className="glass rounded-xl p-8 text-center">
                <div className="text-4xl mb-4">⏳</div>
                <h2 className="text-xl font-bold text-white mb-2">Waiting for Players</h2>
                <p className="text-slate-400">Players are choosing cards to match your clue...</p>
                <p className="text-primary-400 text-lg mt-4">"{clue}"</p>
            </div>
        );
    }

    if (hasSubmitted) {
        return (
            <div className="glass rounded-xl p-8 text-center">
                <div className="text-4xl mb-4">✓</div>
                <h2 className="text-xl font-bold text-white mb-2">Card Submitted!</h2>
                <p className="text-slate-400">Waiting for other players...</p>
                <p className="text-primary-400 text-lg mt-4">Clue: "{clue}"</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="glass rounded-xl p-6 text-center">
                <h2 className="text-lg font-bold text-white mb-2">The Clue Is:</h2>
                <p className="text-2xl text-primary-400">"{clue}"</p>
                <p className="text-slate-400 text-sm mt-2">Choose a card that best matches this clue</p>
            </div>

            <HandDisplay
                cards={hand}
                selectedCard={selectedCard}
                onSelect={setSelectedCard}
                label="Your Hand"
            />

            <button
                onClick={onSubmit}
                disabled={!selectedCard || submitting}
                className="btn btn-primary w-full py-3"
            >
                {submitting ? 'Submitting...' : 'Submit Card'}
            </button>
        </div>
    );
}

// Voting Phase Component
// Voting Phase Component
// Game End View Component
function GameEndView({
    players,
    winnerId,
    onBackToLobby,
}: {
    players: Player[];
    winnerId?: string;
    onBackToLobby: () => void;
}) {
    // Sort players by score
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    const winner = sortedPlayers[0];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-4xl mx-auto text-center"
        >
            <div className="glass rounded-xl p-8 mb-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-transparent pointer-events-none" />

                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 font-cinzel">
                        Game Over
                    </h1>
                    <p className="text-xl text-primary-200 mb-8 font-cinzel">The dream has ended</p>
                </motion.div>

                {/* Winner Display */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.5 }}
                    className="mb-12 relative inline-block"
                >
                    <div className="absolute -inset-10 bg-yellow-500/20 blur-3xl rounded-full" />
                    <div className="relative">
                        <div className="text-8xl mb-4">🏆</div>
                        <div
                            className="w-24 h-24 mx-auto rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-xl border-4 border-yellow-400 mb-4"
                            style={{ backgroundColor: winner.color }}
                        >
                            {winner.initial}
                        </div>
                        <h2 className="text-3xl font-bold text-yellow-400 font-cinzel">{winner.username}</h2>
                        <p className="text-white/60">Winner!</p>
                    </div>
                </motion.div>

                {/* Leaderboard */}
                <div className="max-w-md mx-auto space-y-3">
                    {sortedPlayers.map((player, index) => (
                        <motion.div
                            key={player.id}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.8 + index * 0.1 }}
                            className={`flex items-center gap-4 p-3 rounded-lg ${index === 0 ? 'bg-yellow-500/20 border border-yellow-500/30' : 'bg-white/5'
                                }`}
                        >
                            <div className="font-bold text-slate-400 text-lg w-6">#{index + 1}</div>
                            <div
                                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg"
                                style={{ backgroundColor: player.color }}
                            >
                                {player.initial}
                            </div>
                            <div className="flex-1 text-left">
                                <span className={`font-medium ${index === 0 ? 'text-yellow-200' : 'text-white'}`}>
                                    {player.username}
                                </span>
                            </div>
                            <div className="font-bold text-2xl font-cinzel">{player.score}</div>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-12">
                    <button
                        onClick={onBackToLobby}
                        className="btn btn-primary px-8 py-3 text-lg"
                    >
                        Return to Lobby
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

// Voting Phase Component
function VotingPhase({
    isStoryteller,
    clue,
    cards,
    onVote,
    hasVoted,
    mySubmittedCardId,
    isHost,
    onForceNextPhase,
}: {
    isStoryteller: boolean;
    clue: string;
    cards: Card[];
    onVote: (cardId: string) => void;
    hasVoted: boolean;
    mySubmittedCardId?: string;
    isHost: boolean;
    onForceNextPhase: () => void;
}) {
    const [selectedVoteId, setSelectedVoteId] = useState<string | null>(null);
    const playerCount = cards.length; // Expected: all players' cards

    return (
        <div className="space-y-6">
            <div className="glass rounded-xl p-6 text-center">
                <h2 className="text-lg font-bold text-white mb-2">🗳️ Voting Time!</h2>
                <p className="text-2xl text-primary-400 mb-2 font-cinzel">"{clue}"</p>
                <p className="text-xs text-slate-500 mb-2">({playerCount} cards submitted)</p>

                {isHost && (
                    <div className="mt-4 mb-2">
                        <button
                            onClick={onForceNextPhase}
                            className="text-xs bg-red-500/20 hover:bg-red-500/40 text-red-300 px-3 py-1 rounded border border-red-500/30 transition-colors"
                        >
                            ⚠️ Force Next Phase (Debug)
                        </button>
                    </div>
                )}
                {isStoryteller ? (
                    <p className="text-slate-400 text-sm">You are the storyteller. Watch the votes!</p>
                ) : hasVoted ? (
                    <p className="text-green-400 text-sm">✓ Vote submitted. Waiting for others...</p>
                ) : (
                    <p className="text-slate-400 text-sm">Select the card you think belongs to the storyteller.</p>
                )}
            </div>

            <motion.div
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {cards.map((card) => {
                    const isMyCard = card.id === mySubmittedCardId;
                    const canVote = !isStoryteller && !hasVoted && !isMyCard;
                    const isSelected = selectedVoteId === card.id;

                    return (
                        <motion.div
                            key={card.id}
                            variants={cardVariants}
                            whileHover={canVote ? "hover" : undefined}
                            whileTap={canVote ? "tap" : undefined}
                            onClick={() => canVote && setSelectedVoteId(card.id)}
                            className={`relative aspect-[2/3] rounded-xl overflow-hidden transition-all duration-300
                                ${canVote ? 'cursor-pointer' : ''} 
                                ${isMyCard ? 'opacity-50 ring-2 ring-yellow-500/30' : ''}
                                ${isSelected ? 'ring-4 ring-primary-500 scale-105 z-10 shadow-glow-lg' : ''}
                            `}
                            layoutId={`vote-card-${card.id}`}
                        >
                            <Image src={card.imageUrl} alt="Card" fill className="object-cover" />

                            {isMyCard && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                    <span className="text-white/80 text-xs font-bold uppercase tracking-wider backdrop-blur-sm px-2 py-1 rounded">Your Card</span>
                                </div>
                            )}

                            {isSelected && !hasVoted && (
                                <div className="absolute inset-0 bg-primary-500/20 backdrop-blur-[1px] flex items-center justify-center">
                                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                        <div className="w-4 h-4 rounded-full bg-white animate-pulse" />
                                    </div>
                                </div>
                            )}

                            {/* Vote indicators */}
                            {card.votes && card.votes.length > 0 && (
                                <div className="absolute bottom-2 right-2 flex flex-wrap gap-1 justify-end max-w-[80%]">
                                    {card.votes.map((vote) => (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            key={vote.playerId}
                                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg border border-white/20"
                                            style={{ backgroundColor: vote.color }}
                                            title={vote.username}
                                        >
                                            {vote.initial}
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </motion.div>

            {/* Submit Vote Button */}
            {!isStoryteller && !hasVoted && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="fixed bottom-6 left-0 right-0 px-4 flex justify-center z-50 pointer-events-none"
                    key="submit-button"
                >
                    <button
                        onClick={() => selectedVoteId && onVote(selectedVoteId)}
                        disabled={!selectedVoteId}
                        className={`pointer-events-auto btn btn-primary px-8 py-3 text-lg shadow-xl shadow-primary-500/20 min-w-[200px]
                            ${!selectedVoteId ? 'opacity-50 cursor-not-allowed scale-95 grayscale' : 'hover:scale-105 active:scale-95'}
                        `}
                    >
                        {selectedVoteId ? 'Confirm Vote' : 'Select a Card'}
                    </button>
                </motion.div>
            )}
        </div>
    );
}

// Results Phase Component
function ResultsPhase({
    cards,
    clue,
    storytellerCardId,
    isHost,
    onNextRound,
}: {
    cards: Card[];
    clue: string;
    storytellerCardId?: string;
    isHost: boolean;
    onNextRound: () => void;
}) {
    return (
        <div className="space-y-6">
            <div className="glass rounded-xl p-6 text-center">
                <h2 className="text-lg font-bold text-white mb-2">📊 Round Results</h2>
                <p className="text-primary-400 text-lg font-cinzel">"{clue}"</p>
            </div>

            <motion.div
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {cards.map((card) => {
                    const isStoryteller = card.id === storytellerCardId;
                    return (
                        <motion.div
                            key={card.id}
                            variants={cardVariants}
                            className={`relative aspect-[2/3] rounded-xl overflow-hidden ${isStoryteller ? 'ring-4 ring-primary-500 shadow-glow' : ''
                                }`}
                            layoutId={`result-card-${card.id}`}
                        >
                            <Image src={card.imageUrl} alt="Card" fill className="object-cover" />
                            {isStoryteller && (
                                <motion.div
                                    initial={{ y: -20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="absolute top-2 right-2 bg-primary-500 text-white text-xs px-2 py-1 rounded shadow-lg"
                                >
                                    📖 Storyteller
                                </motion.div>
                            )}
                            {/* Vote indicators in results */}
                            {card.votes && card.votes.length > 0 && (
                                <div className="absolute bottom-2 right-2 flex flex-wrap gap-1 justify-end max-w-[80%]">
                                    {card.votes.map((vote) => (
                                        <div
                                            key={vote.playerId}
                                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg border border-white/20"
                                            style={{ backgroundColor: vote.color }}
                                            title={vote.username}
                                        >
                                            {vote.initial}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </motion.div>

            {isHost && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                >
                    <button onClick={onNextRound} className="btn btn-primary w-full py-3">
                        Next Round →
                    </button>
                </motion.div>
            )}
        </div>
    );
}

// HandDisplay Component
function HandDisplay({
    cards,
    selectedCard,
    onSelect,
    label,
}: {
    cards: Card[];
    selectedCard: string | null;
    onSelect: (id: string | null) => void;
    label: string;
}) {
    return (
        <div className="glass rounded-xl p-4">
            <h3 className="text-sm font-medium text-slate-400 mb-3 ml-1">{label}</h3>
            <motion.div
                className="flex gap-4 overflow-x-auto pb-4 px-1 snap-x"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <AnimatePresence>
                    {cards.map((card) => (
                        <motion.div
                            key={card.id}
                            variants={cardVariants}
                            whileHover="hover"
                            whileTap="tap"
                            onClick={() => onSelect(selectedCard === card.id ? null : card.id)}
                            className={`relative flex-shrink-0 w-28 sm:w-36 aspect-[2/3] rounded-xl overflow-hidden cursor-pointer snap-center
                ${selectedCard === card.id ? 'ring-4 ring-primary-500 shadow-glow-lg' : ''}
              `}
                            layoutId={`card-${card.id}`}
                        >
                            <Image src={card.imageUrl} alt="Card" fill className="object-cover" />
                            {selectedCard === card.id && (
                                <div className="absolute inset-0 bg-primary-500/20 backdrop-blur-[1px]" />
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
