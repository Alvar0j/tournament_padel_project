"use client";

import { useEffect, useState } from "react";
import { useTournamentStore, Pair, Match } from "@/store/useTournamentStore";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Trophy, ArrowLeft, Crown, Check, RotateCcw } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function TournamentPage() {
    const { mode, pairs, matches, setMatches, advanceWinner, undoMatchWinner } = useTournamentStore();
    const [winner, setWinner] = useState<Pair | null>(null);

    useEffect(() => {
        if (pairs.length > 0 && matches.length === 0) {
            generateBracket(pairs);
        }
    }, [pairs, matches.length]);

    useEffect(() => {
        // Check for tournament winner
        if (mode === 'balanced') {
            const finalMatch = matches.find(m => !m.nextMatchId);
            if (finalMatch?.winner) {
                setWinner(finalMatch.winner);
            }
        }
    }, [matches, mode]);

    const generateBracket = (inputPairs: Pair[]) => {
        if (mode === 'captain') {
            // Team vs Team Logic (League Format / Round Robin)
            // Team 1 vs Team 2: Every pair from T1 plays every pair from T2
            const team1Pairs = inputPairs.filter(p => p.teamId === 1);
            const team2Pairs = inputPairs.filter(p => p.teamId === 2);

            const newMatches: Match[] = [];

            // Cross-Team Round Robin (Interleaved)
            // We want to avoid pairs playing consecutive matches.
            // Algorithm: Shift the matchup offset.
            // Round 1: T1[0] vs T2[0], T1[1] vs T2[1], ...
            // Round 2: T1[0] vs T2[1], T1[1] vs T2[2], ...

            const n1 = team1Pairs.length;
            const n2 = team2Pairs.length;

            if (n1 > 0 && n2 > 0) {
                // We iterate through "rounds" of offsets
                // To maximize distribution, we can iterate offset from 0 to n2-1
                for (let offset = 0; offset < n2; offset++) {
                    for (let i = 0; i < n1; i++) {
                        const j = (i + offset) % n2;
                        newMatches.push({
                            id: Math.random().toString(36).substring(7),
                            round: 0,
                            pair1: team1Pairs[i],
                            pair2: team2Pairs[j],
                            winner: null
                        });
                    }
                }
            }

            setMatches(newMatches);
        } else {
            // Balanced Mode Bracket Logic (Existing)
            // 1. Identify Seeds
            const seed1 = inputPairs.find((p) => p.isCaptainPair && p.player1.id === inputPairs[0]?.player1.id || p.player2.id === inputPairs[0]?.player1.id);
            // ... (rest of existing logic) ...

            const captainPairs = inputPairs.filter(p => p.isCaptainPair);
            const otherPairs = inputPairs.filter(p => !p.isCaptainPair);

            // Shuffle others
            const shuffledOthers = [...otherPairs].sort(() => Math.random() - 0.5);

            let orderedPairs: Pair[] = [];
            if (captainPairs.length >= 2) {
                orderedPairs = [captainPairs[0], ...shuffledOthers, captainPairs[1]];
            } else {
                orderedPairs = [...inputPairs].sort(() => Math.random() - 0.5);
            }

            // 2. Create Matches
            const n = orderedPairs.length;
            let powerOf2 = 2;
            while (powerOf2 < n) powerOf2 *= 2;

            const byes = powerOf2 - n;
            const slots: (Pair | null)[] = new Array(powerOf2).fill(null);

            // ... (rest of existing logic, simplified for brevity in this tool call, but I should keep it all)
            // Actually, I need to replace the WHOLE function content if I use replace_file_content on the whole file or large chunk.
            // I will implement the full logic here.

            // ... (Re-implementing existing logic for 'balanced' mode)
            const numFirstRoundMatches = powerOf2 / 2;
            let currentRoundMatches: Match[] = [];
            const getID = () => Math.random().toString(36).substring(7);

            for (let i = 0; i < numFirstRoundMatches; i++) {
                currentRoundMatches.push({
                    id: getID(),
                    round: 0,
                    pair1: null,
                    pair2: null,
                    winner: null
                });
            }

            currentRoundMatches[0].pair1 = orderedPairs[0];
            if (orderedPairs.length > 1) {
                currentRoundMatches[numFirstRoundMatches - 1].pair2 = orderedPairs[orderedPairs.length - 1];
            }

            const remainingPairs = orderedPairs.slice(1, orderedPairs.length - 1);
            const targetSlots: { matchIdx: number, slot: 1 | 2 }[] = [];
            targetSlots.push({ matchIdx: 0, slot: 2 });
            targetSlots.push({ matchIdx: numFirstRoundMatches - 1, slot: 1 });
            for (let i = 1; i < numFirstRoundMatches - 1; i++) {
                targetSlots.push({ matchIdx: i, slot: 1 });
                targetSlots.push({ matchIdx: i, slot: 2 });
            }

            let byeCount = byes;
            for (const slotRef of targetSlots) {
                if (byeCount > 0) {
                    byeCount--;
                } else {
                    const p = remainingPairs.shift();
                    if (p) {
                        if (slotRef.slot === 1) currentRoundMatches[slotRef.matchIdx].pair1 = p;
                        else currentRoundMatches[slotRef.matchIdx].pair2 = p;
                    }
                }
            }

            currentRoundMatches.forEach(m => {
                if (m.pair1 && !m.pair2) m.winner = m.pair1;
                if (!m.pair1 && m.pair2) m.winner = m.pair2;
            });

            const newMatches: Match[] = [];
            newMatches.push(...currentRoundMatches);

            let prevRoundMatches = currentRoundMatches;
            let roundNum = 1;

            while (prevRoundMatches.length > 1) {
                const nextRoundMatches: Match[] = [];
                const numNext = prevRoundMatches.length / 2;

                for (let i = 0; i < numNext; i++) {
                    const nextMatchId = getID();
                    const m1 = prevRoundMatches[i * 2];
                    const m2 = prevRoundMatches[i * 2 + 1];

                    m1.nextMatchId = nextMatchId;
                    m1.nextMatchSlot = 1;
                    m2.nextMatchId = nextMatchId;
                    m2.nextMatchSlot = 2;

                    const nextMatch: Match = {
                        id: nextMatchId,
                        round: roundNum,
                        pair1: m1.winner || null,
                        pair2: m2.winner || null,
                        winner: null
                    };
                    nextRoundMatches.push(nextMatch);
                }
                newMatches.push(...nextRoundMatches);
                prevRoundMatches = nextRoundMatches;
                roundNum++;
            }
            setMatches(newMatches);
        }
    };

    // Group matches by round for display (Balanced Mode)
    const rounds = matches.reduce((acc, match) => {
        if (!acc[match.round]) acc[match.round] = [];
        acc[match.round].push(match);
        return acc;
    }, {} as Record<number, Match[]>);

    const roundIndices = Object.keys(rounds).map(Number).sort((a, b) => a - b);

    // Calculate Team Scores (Captain Mode)
    const team1Wins = matches.filter(m => m.winner?.teamId === 1).length;
    const team2Wins = matches.filter(m => m.winner?.teamId === 2).length;

    return (
        <div className="min-h-screen bg-slate-950 p-4 pb-20 text-slate-50">
            <div className="mx-auto max-w-4xl space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                        {mode === 'captain' ? 'Enfrentamientos de Equipos' : 'Cuadro del Torneo'}
                    </h1>
                    <Link href="/">
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Salir
                        </Button>
                    </Link>
                </div>

                {mode === 'captain' && (
                    <Card className="bg-slate-900 border-slate-800 mb-8">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-center text-3xl font-bold">
                                <div className="text-emerald-400">Equipo 1: {team1Wins}</div>
                                <div className="text-slate-600">-</div>
                                <div className="text-blue-400">Equipo 2: {team2Wins}</div>
                            </div>
                            {matches.length > 0 && matches.every(m => m.winner) && (
                                <div className="mt-6 text-center animate-in zoom-in duration-500">
                                    <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600">
                                        {team1Wins > team2Wins ? "¡Gana el Equipo 1!" : team2Wins > team1Wins ? "¡Gana el Equipo 2!" : "¡Es un Empate!"}
                                    </h2>
                                    <Link href="/">
                                        <Button
                                            variant="outline"
                                            className="mt-4 text-slate-900 hover:bg-slate-100"
                                        >
                                            Volver al Inicio
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {mode === 'balanced' && winner && (
                    <Card className="bg-gradient-to-br from-yellow-500 to-amber-600 border-none text-white">
                        <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
                            <Trophy className="h-16 w-16 text-yellow-100" />
                            <div className="text-center">
                                <h2 className="text-2xl font-bold">¡Campeones!</h2>
                                <p className="text-xl mt-2">{winner.player1.name} & {winner.player2.name}</p>
                            </div>
                            <Link href="/">
                                <Button
                                    variant="outline"
                                    className="mt-4 text-slate-900 hover:bg-slate-100"
                                >
                                    Volver al Inicio
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}

                {mode === 'captain' ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {matches.map((match, index) => (
                            <Card key={match.id} className="bg-slate-900 border-slate-800">
                                <div className="p-2 text-center text-xs text-slate-500 font-mono uppercase tracking-widest border-b border-slate-800">
                                    Partido {index + 1}
                                </div>
                                <div className="flex flex-col divide-y divide-slate-800">
                                    {/* Player 1 (Team 1) */}
                                    <button
                                        className={cn(
                                            "flex items-center justify-between p-3 transition-colors",
                                            match.winner?.id === match.pair1?.id ? "bg-emerald-900/30 text-emerald-400" : "hover:bg-slate-800 text-white",
                                            !match.pair1 && "opacity-50 cursor-default"
                                        )}
                                        disabled={!match.pair1 || !match.pair2}
                                        onClick={() => {
                                            if (!match.pair1) return;
                                            if (match.winner && match.winner.id !== match.pair1.id) {
                                                if (!confirm("¿Cambiar ganador?")) return;
                                            }
                                            advanceWinner(match.id, match.pair1);
                                        }}
                                    >
                                        <span className="text-sm font-medium">
                                            {match.pair1 ? `${match.pair1.player1.name}/${match.pair1.player2.name}` : "Pase"}
                                        </span>
                                        {match.winner?.id === match.pair1?.id && <Check className="h-4 w-4" />}
                                    </button>

                                    {/* Player 2 (Team 2) */}
                                    <button
                                        className={cn(
                                            "flex items-center justify-between p-3 transition-colors",
                                            match.winner?.id === match.pair2?.id ? "bg-blue-900/30 text-blue-400" : "hover:bg-slate-800 text-white",
                                            !match.pair2 && "opacity-50 cursor-default"
                                        )}
                                        disabled={!match.pair1 || !match.pair2}
                                        onClick={() => {
                                            if (!match.pair2) return;
                                            if (match.winner && match.winner.id !== match.pair2.id) {
                                                if (!confirm("¿Cambiar ganador?")) return;
                                            }
                                            advanceWinner(match.id, match.pair2);
                                        }}
                                    >
                                        <span className="text-sm font-medium">
                                            {match.pair2 ? `${match.pair2.player1.name}/${match.pair2.player2.name}` : "Pase"}
                                        </span>
                                        {match.winner?.id === match.pair2?.id && <Check className="h-4 w-4" />}
                                    </button>
                                </div>
                                {match.winner && (
                                    <div className="absolute -right-2 -top-2">
                                        <Button
                                            size="icon"
                                            variant="outline"
                                            className="h-6 w-6 rounded-full bg-slate-700 hover:bg-red-600 hover:text-white border border-slate-600 shadow-lg"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm("¿Reiniciar partido?")) undoMatchWinner(match.id);
                                            }}
                                        >
                                            <RotateCcw className="h-3 w-3" />
                                        </Button>
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="flex gap-4 overflow-x-auto pb-8">
                        {roundIndices.map((roundIdx) => (
                            <div key={roundIdx} className="flex min-w-[250px] flex-col gap-4 justify-around">
                                <h3 className="text-center font-semibold text-slate-500 uppercase tracking-wider text-xs mb-4">
                                    {roundIdx === roundIndices[roundIndices.length - 1] ? "Final" :
                                        roundIdx === roundIndices[roundIndices.length - 2] ? "Semifinales" :
                                            `Ronda ${roundIdx + 1}`}
                                </h3>
                                {rounds[roundIdx].map((match) => (
                                    <Card key={match.id} className="bg-slate-900 border-slate-800 relative">
                                        <div className="flex flex-col divide-y divide-slate-800">
                                            {/* Player 1 */}
                                            <button
                                                className={cn(
                                                    "flex items-center justify-between p-3 transition-colors",
                                                    match.winner?.id === match.pair1?.id ? "bg-emerald-900/30 text-emerald-400" : "hover:bg-slate-800 text-white",
                                                    !match.pair1 && "opacity-50 cursor-default"
                                                )}
                                                disabled={!match.pair1 || !match.pair2}
                                                onClick={() => {
                                                    if (!match.pair1) return;
                                                    if (match.winner && match.winner.id !== match.pair1.id) {
                                                        if (!confirm("¿Cambiar ganador? Esto reiniciará los partidos siguientes.")) return;
                                                    }
                                                    advanceWinner(match.id, match.pair1);
                                                }}
                                            >
                                                <span className="text-sm font-medium ">
                                                    {match.pair1 ? (
                                                        <>
                                                            {match.pair1.player1.name}/{match.pair1.player2.name}
                                                            {match.pair1.isCaptainPair && <Crown className="inline ml-1 w-3 h-3 text-yellow-500" />}
                                                        </>
                                                    ) : "Pase"}
                                                </span>
                                                {match.winner?.id === match.pair1?.id && <Check className="h-4 w-4" />}
                                            </button>

                                            {/* Player 2 */}
                                            <button
                                                className={cn(
                                                    "flex items-center justify-between p-3 transition-colors",
                                                    match.winner?.id === match.pair2?.id ? "bg-emerald-900/30 text-emerald-400" : "hover:bg-slate-800 text-white",
                                                    !match.pair2 && "opacity-50 cursor-default"
                                                )}
                                                disabled={!match.pair1 || !match.pair2}
                                                onClick={() => {
                                                    if (!match.pair2) return;
                                                    if (match.winner && match.winner.id !== match.pair2.id) {
                                                        if (!confirm("¿Cambiar ganador? Esto reiniciará los partidos siguientes.")) return;
                                                    }
                                                    advanceWinner(match.id, match.pair2);
                                                }}
                                            >
                                                <span className="flex items-center gap-2 font-medium">
                                                    {match.pair2 ? (
                                                        <>
                                                            {match.pair2.player1.name}/{match.pair2.player2.name}
                                                            {match.pair2.isCaptainPair && <Crown className="h-3 w-3 text-yellow-500" />}
                                                        </>
                                                    ) : "Pase"}
                                                </span>
                                                {match.winner?.id === match.pair2?.id && <Check className="h-4 w-4" />}
                                            </button>
                                        </div>

                                        {/* Undo Button */}
                                        {match.winner && (
                                            <div className="absolute -right-2 -top-2">
                                                <Button
                                                    size="icon"
                                                    variant="outline"
                                                    className="h-6 w-6 rounded-full bg-slate-700 hover:bg-red-600 hover:text-white border border-slate-600 shadow-lg"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (confirm("Are you sure you want to undo this match result?")) {
                                                            undoMatchWinner(match.id);
                                                        }
                                                    }}
                                                >
                                                    <RotateCcw className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        )}
                                    </Card>
                                ))}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
