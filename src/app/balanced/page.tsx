"use client";

import { useState } from "react";
import { usePlayerStore, Player } from "@/store/usePlayerStore";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Check, Star, User } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

type Phase = "select-top" | "result";

export default function BalancedPage() {
    const { players } = usePlayerStore();
    const [phase, setPhase] = useState<Phase>("select-top");
    const [topPlayers, setTopPlayers] = useState<Player[]>([]);
    const [pairs, setPairs] = useState<[Player, Player][]>([]);

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

        const newPairs: [Player, Player][] = [];

        // Pair top with bottom
        // Note: If odd number of players, one group will be larger.
        // Logic: Pair 1 Top with 1 Bottom until one runs out.
        // If we have extra Top players (e.g. 7 top, 5 bottom), 2 top will play together?
        // Or if we have extra Bottom players.
        // The requirement says "50% top, 50% bottom".
        // If 12 players, 6 top, 6 bottom -> 6 pairs.
        // If 13 players? 7 top, 6 bottom?
        // Let's assume we just pair them up.

        // We will iterate through the larger list to ensure everyone is paired if possible,
        // but strictly we want Top-Bottom pairs.
        // Any remainders will have to pair with each other.

        // Let's just pair index by index for now, assuming user selected half.

        const maxLen = Math.max(shuffledTop.length, shuffledBottom.length);

        // Actually, let's just pop from lists.
        const tempTop = [...shuffledTop];
        const tempBottom = [...shuffledBottom];

        while (tempTop.length > 0 && tempBottom.length > 0) {
            newPairs.push([tempTop.pop()!, tempBottom.pop()!]);
        }

        // Handle remainders (if any)
        const remainders = [...tempTop, ...tempBottom];
        while (remainders.length >= 2) {
            newPairs.push([remainders.pop()!, remainders.pop()!]);
        }

        // If one player left alone?
        // They sit out or we show them as "Waiting".

        setPairs(newPairs);
        setPhase("result");
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
                        {phase === "select-top" && `Select Top ${requiredTopCount} Players`}
                        {phase === "result" && "Balanced Pairs"}
                    </h1>
                    <Link href="/">
                        <Button variant="ghost" size="sm">
                            Quit
                        </Button>
                    </Link>
                </div>

                {phase === "select-top" && (
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

                {phase === "result" && (
                    <div className="space-y-4">
                        {pairs.map((pair, index) => (
                            <Card key={index} className="overflow-hidden">
                                <div className="flex">
                                    <div className="flex-1 bg-emerald-50 p-4 text-center font-medium text-emerald-900">
                                        {pair[0].name}
                                    </div>
                                    <div className="flex items-center justify-center bg-slate-100 px-2 text-slate-400">
                                        vs
                                    </div>
                                    <div className="flex-1 bg-blue-50 p-4 text-center font-medium text-blue-900">
                                        {pair[1].name}
                                    </div>
                                </div>
                            </Card>
                        ))}

                        <div className="pt-4">
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => {
                                    setTopPlayers([]);
                                    setPhase("select-top");
                                }}
                            >
                                Start Over
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
