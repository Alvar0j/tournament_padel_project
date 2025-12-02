import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Player } from './usePlayerStore';

export interface Pair {
    id: string;
    player1: Player;
    player2: Player;
    isCaptainPair?: boolean; // To identify seeds
    teamId?: 1 | 2; // For Captains Mode
}

export interface Match {
    id: string;
    round: number; // 0 = finals, 1 = semis, 2 = quarters, etc. (or reverse)
    // Let's use: 0 = Round of 16, 1 = Quarters, 2 = Semis, 3 = Final
    // Or better: just track "nextMatchId"
    pair1: Pair | null; // null if waiting for winner
    pair2: Pair | null;
    winner: Pair | null;
    nextMatchId?: string;
    nextMatchSlot?: 1 | 2; // 1 for pair1, 2 for pair2
    score?: { team1: number; team2: number };
}

interface TournamentState {
    mode: 'captain' | 'balanced' | null;
    pairs: Pair[];
    matches: Match[];
    setPairs: (pairs: Pair[]) => void;
    setMatches: (matches: Match[]) => void;
    startTournament: (mode: 'captain' | 'balanced', pairs: Pair[]) => void;
    advanceWinner: (matchId: string, winnerPair: Pair) => void;
    updateMatchScore: (matchId: string, score: { team1: number; team2: number }) => void;
    undoMatchWinner: (matchId: string) => void;
    resetTournament: () => void;
}

export const useTournamentStore = create<TournamentState>()(
    persist(
        (set) => ({
            mode: null,
            pairs: [],
            matches: [],
            setPairs: (pairs) => set({ pairs }),
            setMatches: (matches) => set({ matches }),
            startTournament: (mode, pairs) => set({ mode, pairs, matches: [] }),
            resetTournament: () => set({ mode: null, pairs: [], matches: [] }),
            updateMatchScore: (matchId, score) =>
                set((state) => ({
                    matches: state.matches.map((m) =>
                        m.id === matchId ? { ...m, score } : m
                    ),
                })),
            advanceWinner: (matchId, winnerPair) =>
                set((state) => {
                    const currentMatch = state.matches.find((m) => m.id === matchId);

                    // Helper to recursively clear future matches if a winner changes
                    const recursiveClear = (matches: Match[], matchId: string, slot: 1 | 2): Match[] => {
                        const matchIndex = matches.findIndex(m => m.id === matchId);
                        if (matchIndex === -1) return matches;

                        const match = matches[matchIndex];
                        const oldWinner = match.winner;

                        // Clear the specific slot
                        let updatedMatch = { ...match };
                        if (slot === 1) updatedMatch.pair1 = null;
                        else updatedMatch.pair2 = null;

                        // If the match had a winner, and that winner came from the cleared slot (or we just reset the match),
                        // we need to clear the winner and propagate.
                        // Actually, if we clear a slot, the match can no longer have a valid winner (unless it's a bye, but here we are clearing a real player).
                        // So we should clear the winner of THIS match too.

                        if (updatedMatch.winner) {
                            updatedMatch.winner = null;
                            let updatedMatches = [...matches];
                            updatedMatches[matchIndex] = updatedMatch;

                            if (updatedMatch.nextMatchId && updatedMatch.nextMatchSlot) {
                                return recursiveClear(updatedMatches, updatedMatch.nextMatchId, updatedMatch.nextMatchSlot);
                            }
                            return updatedMatches;
                        }

                        let updatedMatches = [...matches];
                        updatedMatches[matchIndex] = updatedMatch;
                        return updatedMatches;
                    };

                    if (!currentMatch || !currentMatch.nextMatchId) {
                        // Final match or invalid
                        return {
                            matches: state.matches.map(m => m.id === matchId ? { ...m, winner: winnerPair } : m)
                        };
                    }

                    // Find next match
                    const nextMatchIndex = state.matches.findIndex(
                        (m) => m.id === currentMatch.nextMatchId
                    );

                    if (nextMatchIndex === -1) return state;

                    const nextMatch = state.matches[nextMatchIndex];
                    const targetSlot = currentMatch.nextMatchSlot || (nextMatch.pair1 === null ? 1 : 2); // Fallback if not set

                    // Update current match winner
                    let updatedMatches = state.matches.map((m) =>
                        m.id === matchId ? { ...m, winner: winnerPair } : m
                    );

                    // Check if we are changing the winner (overwriting a slot that was already filled)
                    // If nextMatch already has a player in targetSlot, and it's different (or same), we update it.
                    // But if nextMatch ALREADY had a winner, and that winner was the player we are replacing (or even if it wasn't, the match result might be invalid now),
                    // we should probably reset the next match's winner to force re-play.

                    const nextMatchExistingWinner = nextMatch.winner;

                    // Update next match slot
                    updatedMatches[nextMatchIndex] = {
                        ...nextMatch,
                        pair1: targetSlot === 1 ? winnerPair : nextMatch.pair1,
                        pair2: targetSlot === 2 ? winnerPair : nextMatch.pair2,
                        // If we change the input pair, we should reset the winner of the next match to force re-playing it.
                        winner: null
                    };

                    // If next match had a winner, we need to recursively clear ITs next match
                    if (nextMatchExistingWinner && nextMatch.nextMatchId && nextMatch.nextMatchSlot) {
                        updatedMatches = recursiveClear(updatedMatches, nextMatch.nextMatchId, nextMatch.nextMatchSlot);
                    }

                    return { matches: updatedMatches };
                }),
            undoMatchWinner: (matchId) =>
                set((state) => {
                    const recursiveUndo = (matches: Match[], targetMatchId: string): Match[] => {
                        const matchIndex = matches.findIndex(m => m.id === targetMatchId);
                        if (matchIndex === -1) return matches;

                        const match = matches[matchIndex];
                        if (!match.winner) return matches; // Already no winner

                        const winnerToRemove = match.winner;

                        // 1. Remove winner from current match
                        let updatedMatches = [...matches];
                        updatedMatches[matchIndex] = { ...match, winner: null };

                        // 2. If there is a next match, remove this player from it
                        if (match.nextMatchId) {
                            const nextMatchIndex = updatedMatches.findIndex(m => m.id === match.nextMatchId);
                            if (nextMatchIndex !== -1) {
                                const nextMatch = updatedMatches[nextMatchIndex];

                                // If next match has a winner, we must undo it first (recursive)
                                if (nextMatch.winner) {
                                    updatedMatches = recursiveUndo(updatedMatches, nextMatch.id);
                                    // Re-fetch next match after recursive update
                                    const refreshedNextMatch = updatedMatches[nextMatchIndex];
                                    updatedMatches[nextMatchIndex] = {
                                        ...refreshedNextMatch,
                                        pair1: refreshedNextMatch.pair1?.id === winnerToRemove.id ? null : refreshedNextMatch.pair1,
                                        pair2: refreshedNextMatch.pair2?.id === winnerToRemove.id ? null : refreshedNextMatch.pair2,
                                    };
                                } else {
                                    updatedMatches[nextMatchIndex] = {
                                        ...nextMatch,
                                        pair1: nextMatch.pair1?.id === winnerToRemove.id ? null : nextMatch.pair1,
                                        pair2: nextMatch.pair2?.id === winnerToRemove.id ? null : nextMatch.pair2,
                                    };
                                }
                            }
                        }
                        return updatedMatches;
                    };

                    return { matches: recursiveUndo(state.matches, matchId) };
                }),
        }),
        {
            name: 'padel-tournament-storage',
        }
    )
);
