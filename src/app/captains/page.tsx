"use client";

import { useState } from "react";
import { usePlayerStore, Player } from "@/store/usePlayerStore";
import { useTournamentStore, Pair } from "@/store/useTournamentStore";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Check, Crown, User, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Phase = "select-captains" | "draft" | "form-pairs";

export default function CaptainsPage() {
    const router = useRouter();
    const { players } = usePlayerStore();
    const { startTournament } = useTournamentStore();

    const [phase, setPhase] = useState<Phase>("select-captains");
    const [captains, setCaptains] = useState<Player[]>([]);
    const [team1, setTeam1] = useState<Player[]>([]);
    const [team2, setTeam2] = useState<Player[]>([]);
    const [currentTurn, setCurrentTurn] = useState<0 | 1>(0); // 0 for captain 1, 1 for captain 2

    // For pair formation
    const [team1Pairs, setTeam1Pairs] = useState<Pair[]>([]);
    const [team2Pairs, setTeam2Pairs] = useState<Pair[]>([]);
    const [selectedForPair, setSelectedForPair] = useState<{ player: Player; teamId: 1 | 2 } | null>(null);

    // Filter out players already selected as captains or in teams
    const availablePlayers = players.filter(
        (p) =>
            !captains.find((c) => c.id === p.id) &&
            !team1.find((t) => t.id === p.id) &&
            !team2.find((t) => t.id === p.id)
    );

    const toggleCaptain = (player: Player) => {
        if (captains.find((c) => c.id === player.id)) {
            setCaptains(captains.filter((c) => c.id !== player.id));
        } else {
            if (captains.length < 2) {
                setCaptains([...captains, player]);
            }
        }
    };

    const startDraft = () => {
        if (captains.length === 2) {
            setTeam1([captains[0]]);
            setTeam2([captains[1]]);
            setPhase("draft");
        }
    };

    const pickPlayer = (player: Player) => {
        if (currentTurn === 0) {
            setTeam1([...team1, player]);
            setCurrentTurn(1);
        } else {
            setTeam2([...team2, player]);
            setCurrentTurn(0);
        }
    };

    const handlePairing = (player: Player, teamId: 1 | 2) => {
        if (selectedForPair) {
            if (selectedForPair.player.id === player.id) {
                setSelectedForPair(null); // Deselect
                return;
            }

            // Enforce same team
            if (selectedForPair.teamId !== teamId) {
                alert("¡Solo puedes emparejar jugadores del mismo equipo!");
                return;
            }

            // Form pair
            const newPair: Pair = {
                id: Math.random().toString(36).substring(7),
                player1: selectedForPair.player,
                player2: player,
                isCaptainPair: (selectedForPair.player.id === captains[teamId - 1].id || player.id === captains[teamId - 1].id)
            };

            if (teamId === 1) {
                setTeam1Pairs([...team1Pairs, newPair]);
            } else {
                setTeam2Pairs([...team2Pairs, newPair]);
            }
            setSelectedForPair(null);
        } else {
            setSelectedForPair({ player, teamId });
        }
    };

    const removePair = (pairId: string, teamId: 1 | 2) => {
        if (teamId === 1) {
            setTeam1Pairs(team1Pairs.filter((p) => p.id !== pairId));
        } else {
            setTeam2Pairs(team2Pairs.filter((p) => p.id !== pairId));
        }
    };

    const finalizeTournament = () => {
        const team1WithId = team1Pairs.map(p => ({ ...p, teamId: 1 as const }));
        const team2WithId = team2Pairs.map(p => ({ ...p, teamId: 2 as const }));
        startTournament('captain', [...team1WithId, ...team2WithId]);
        router.push("/tournament");
    };

    // Helper to check if player is already paired
    const isPaired = (player: Player, pairs: Pair[]) => {
        return pairs.some(p => p.player1.id === player.id || p.player2.id === player.id);
    };

    if (players.length < 4) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
                <h1 className="mb-4 text-xl font-bold">No hay suficientes jugadores</h1>
                <p className="mb-8 text-slate-500">
                    Necesitas al menos 4 jugadores para comenzar.
                </p>
                <Link href="/players">
                    <Button>Ir a Jugadores</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-4 pb-20">
            <div className="mx-auto max-w-md space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold text-slate-900">
                        {phase === "select-captains" && "Selecciona 2 Capitanes"}
                        {phase === "draft" && "Elegir Equipos"}
                        {phase === "form-pairs" && "Formar Parejas"}
                    </h1>
                    <Link href="/">
                        <Button variant="ghost" size="sm">
                            Salir
                        </Button>
                    </Link>
                </div>

                {phase === "select-captains" && (
                    <>
                        <div className="grid grid-cols-2 gap-2">
                            {players.map((player) => {
                                const isCaptain = captains.find((c) => c.id === player.id);
                                return (
                                    <Button
                                        key={player.id}
                                        variant={isCaptain ? "default" : "outline"}
                                        className={cn(
                                            "h-auto justify-start px-4 py-3",
                                            isCaptain ? "bg-indigo-600 hover:bg-indigo-700" : ""
                                        )}
                                        onClick={() => toggleCaptain(player)}
                                    >
                                        {isCaptain ? (
                                            <Crown className="mr-2 h-4 w-4 text-yellow-400" />
                                        ) : (
                                            <User className="mr-2 h-4 w-4 text-slate-400" />
                                        )}
                                        {player.name}
                                    </Button>
                                );
                            })}
                        </div>
                        <div className="fixed bottom-4 left-4 right-4">
                            <Button
                                className="w-full bg-indigo-600 hover:bg-indigo-700"
                                disabled={captains.length !== 2}
                                onClick={startDraft}
                            >
                                Comienza el Draft
                            </Button>
                        </div>
                    </>
                )}

                {phase === "draft" && (
                    <>
                        <div className="grid grid-cols-2 gap-4 text-center">
                            <Card className={cn("border-2", currentTurn === 0 ? "border-indigo-500" : "border-transparent")}>
                                <CardHeader className="p-4">
                                    <CardTitle className="text-sm">Equipo {captains[0].name}</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 text-xs">
                                    {team1.map((p) => (
                                        <div key={p.id} className="py-1">{p.name}</div>
                                    ))}
                                </CardContent>
                            </Card>
                            <Card className={cn("border-2", currentTurn === 1 ? "border-indigo-500" : "border-transparent")}>
                                <CardHeader className="p-4">
                                    <CardTitle className="text-sm">Equipo {captains[1].name}</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 text-xs">
                                    {team2.map((p) => (
                                        <div key={p.id} className="py-1">{p.name}</div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-center text-sm font-medium text-slate-500">
                                Turno de {currentTurn === 0 ? captains[0].name : captains[1].name}
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                                {availablePlayers.map((player) => (
                                    <Button
                                        key={player.id}
                                        variant="outline"
                                        className="justify-start"
                                        onClick={() => pickPlayer(player)}
                                    >
                                        {player.name}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {availablePlayers.length === 0 && (
                            <div className="fixed bottom-4 left-4 right-4">
                                <Button
                                    className="w-full"
                                    onClick={() => setPhase("form-pairs")}
                                >
                                    Siguiente: Formar las parejas
                                </Button>
                            </div>
                        )}
                    </>
                )}

                {phase === "form-pairs" && (
                    <div className="space-y-8">
                        {/* Team 1 */}
                        <div className="space-y-2">
                            <h3 className="font-semibold text-indigo-900">Equipo {captains[0].name}</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {team1.map(p => {
                                    const paired = isPaired(p, team1Pairs);
                                    const isSelected = selectedForPair?.player.id === p.id;
                                    if (paired) return null;
                                    return (
                                        <Button
                                            key={p.id}
                                            variant={isSelected ? "default" : "outline"}
                                            onClick={() => handlePairing(p, 1)}
                                            className={cn(isSelected && "bg-indigo-600")}
                                        >
                                            {p.name}
                                        </Button>
                                    )
                                })}
                            </div>
                            <div className="space-y-1 mt-2">
                                {team1Pairs.map(pair => (
                                    <div key={pair.id} className="text-sm bg-indigo-50 p-2 rounded flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <span>{pair.player1.name} + {pair.player2.name}</span>
                                            {pair.isCaptainPair && <Crown className="w-3 h-3 text-yellow-500" />}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 text-slate-400 hover:text-red-500"
                                            onClick={() => removePair(pair.id, 1)}
                                        >
                                            <span className="sr-only">Remove</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x h-4 w-4"><path d="M18 6 6 18" /><path d="m6 6 18 12" /></svg>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Team 2 */}
                        <div className="space-y-2">
                            <h3 className="font-semibold text-purple-900">Equipo {captains[1].name}</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {team2.map(p => {
                                    const paired = isPaired(p, team2Pairs);
                                    const isSelected = selectedForPair?.player.id === p.id;
                                    if (paired) return null;
                                    return (
                                        <Button
                                            key={p.id}
                                            variant={isSelected ? "default" : "outline"}
                                            onClick={() => handlePairing(p, 2)}
                                            className={cn(isSelected && "bg-purple-600")}
                                        >
                                            {p.name}
                                        </Button>
                                    )
                                })}
                            </div>
                            <div className="space-y-1 mt-2">
                                {team2Pairs.map(pair => (
                                    <div key={pair.id} className="text-sm bg-purple-50 p-2 rounded flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <span>{pair.player1.name} + {pair.player2.name}</span>
                                            {pair.isCaptainPair && <Crown className="w-3 h-3 text-yellow-500" />}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 text-slate-400 hover:text-red-500"
                                            onClick={() => removePair(pair.id, 2)}
                                        >
                                            <span className="sr-only">Remove</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x h-4 w-4"><path d="M18 6 6 18" /><path d="m6 6 18 12" /></svg>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>


                        <div className="fixed bottom-4 left-4 right-4">
                            <Button
                                className="w-full bg-slate-900"
                                disabled={
                                    team1Pairs.length * 2 !== team1.length ||
                                    team2Pairs.length * 2 !== team2.length
                                }
                                onClick={finalizeTournament}
                            >
                                Comienza el Torneo <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
}
