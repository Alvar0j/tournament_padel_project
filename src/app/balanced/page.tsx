"use client";

import { useState } from "react";
import { usePlayerStore, Player } from "@/store/usePlayerStore";
import { useTournamentStore, Pair } from "@/store/useTournamentStore";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Check, Star, User } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Step = "select-top" | "result";

export default function BalancedPage() {
    const router = useRouter();
    const { players } = usePlayerStore();
    const { startTournament } = useTournamentStore();

    const [step, setStep] = useState<Step>("select-top");
    const [topPlayers, setTopPlayers] = useState<Player[]>([]);
    const [pairs, setPairs] = useState<Pair[]>([]);

    const requiredTopCount = Math.ceil(players.length / 2);

    const toggleTopPlayer = (player: Player) => {
        if (topPlayers.find((p) => p.id === player.id)) {
            setTopPlayers(topPlayers.filter((p) => p.id !== player.id));
        } else {
            if (topPlayers.length < requiredTopCount) {
                setTopPlayers([...topPlayers, player]);
            }
        }
    };

    const generatePairs = () => {
        const bottomPlayers = players.filter(
            (p) => !topPlayers.find((tp) => tp.id === p.id)
        );

        // Shuffle both arrays
        const shuffledTop = [...topPlayers].sort(() => Math.random() - 0.5);
        const shuffledBottom = [...bottomPlayers].sort(() => Math.random() - 0.5);

        const newPairs: Pair[] = [];

        // Pair top with bottom
        const tempTop = [...shuffledTop];
        const tempBottom = [...shuffledBottom];

        while (tempTop.length > 0 && tempBottom.length > 0) {
            newPairs.push({
                id: Math.random().toString(36).substring(7),
                player1: tempTop.pop()!,
                player2: tempBottom.pop()!
            });
        }

        // Handle remainders (if any)
        const remainders = [...tempTop, ...tempBottom];
        while (remainders.length >= 2) {
            newPairs.push({
                id: Math.random().toString(36).substring(7),
                player1: remainders.pop()!,
                player2: remainders.pop()!
            });
        }

        setPairs(newPairs);
        setStep("result");
    };

    if (players.length < 4) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
                <h1 className="mb-4 text-xl font-bold">Not enough players</h1>
                <p className="mb-8 text-slate-500">
                    You need at least 4 players to start.
                </p>
                <Link href="/players">
                    <Button>Go to Players</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-4 pb-20">
            <div className="mx-auto max-w-md space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold text-slate-900">
                        {step === "select-top" && `Select Top ${requiredTopCount} Players`}
                        {step === "result" && "Balanced Pairs"}
                    </h1>
                    <Link href="/">
                        <Button variant="ghost" size="sm">
                            Quit
                        </Button>
                    </Link>
                </div>

                {step === "select-top" && (
                    <>
                        <p className="text-sm text-slate-500">
                            Select the best players. They will be paired with the others.
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            {players.map((player) => {
                                const isTop = topPlayers.find((p) => p.id === player.id);
                                return (
                                    <Button
                                        key={player.id}
                                        variant={isTop ? "default" : "outline"}
                                        className={cn(
                                            "h-auto justify-start px-4 py-3",
                                            isTop ? "bg-emerald-600 hover:bg-emerald-700" : ""
                                        )}
                                        onClick={() => toggleTopPlayer(player)}
                                    >
                                        {isTop ? (
                                            <Star className="mr-2 h-4 w-4 text-yellow-400" />
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
                                className="w-full bg-emerald-600 hover:bg-emerald-700"
                                disabled={topPlayers.length !== requiredTopCount}
                                onClick={generatePairs}
                            >
                                Generate Pairs
                            </Button>
                        </div>
                    </>
                )}

                {step === "result" && (
                    <div className="space-y-4">
                        {pairs.map((pair) => (
                            <Card key={pair.id} className="overflow-hidden">
                                <div className="flex">
                                    <div className="flex-1 bg-emerald-50 p-4 text-center font-medium text-emerald-900">
                                        {pair.player1.name}
                                    </div>
                                    <div className="flex items-center justify-center bg-slate-100 px-2 text-slate-400">
                                        vs
                                    </div>
                                    <div className="flex-1 bg-blue-50 p-4 text-center font-medium text-blue-900">
                                        {pair.player2.name}
                                    </div>
                                </div>
                            </Card>
                        ))}

                        <div className="fixed bottom-4 left-4 right-4 flex gap-2">
                            <Button
                                variant="outline"
                                className="flex-1 bg-white"
                                onClick={() => {
                                    setTopPlayers([]);
                                    setStep("select-top");
                                }}
                            >
                                Start Over
                            </Button>
                            <Button
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                                onClick={() => {
                                    startTournament('balanced', pairs);
                                    router.push("/tournament");
                                }}
                            >
                                Start Tournament
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
