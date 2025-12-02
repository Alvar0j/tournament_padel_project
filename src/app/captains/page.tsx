"use client";

import { useState } from "react";
import { usePlayerStore, Player } from "@/store/usePlayerStore";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Check, Crown, User } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

type Phase = "select-captains" | "draft" | "result";

export default function CaptainsPage() {
    const { players } = usePlayerStore();
    const [phase, setPhase] = useState<Phase>("select-captains");
    const [captains, setCaptains] = useState<Player[]>([]);
    const [team1, setTeam1] = useState<Player[]>([]);
    const [team2, setTeam2] = useState<Player[]>([]);
    const [currentTurn, setCurrentTurn] = useState<0 | 1>(0); // 0 for captain 1, 1 for captain 2

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
                        {phase === "select-captains" && "Select 2 Captains"}
                        {phase === "draft" && "Draft Teams"}
                        {phase === "result" && "Teams Ready"}
                    </h1>
                    <Link href="/">
                        <Button variant="ghost" size="sm">
                            Quit
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
                                Start Draft
                            </Button>
                        </div>
                    </>
                )}

                {phase === "draft" && (
                    <>
                        <div className="grid grid-cols-2 gap-4 text-center">
                            <Card className={cn("border-2", currentTurn === 0 ? "border-indigo-500" : "border-transparent")}>
                                <CardHeader className="p-4">
                                    <CardTitle className="text-sm">Team {captains[0].name}</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 text-xs">
                                    {team1.map((p) => (
                                        <div key={p.id} className="py-1">{p.name}</div>
                                    ))}
                                </CardContent>
                            </Card>
                            <Card className={cn("border-2", currentTurn === 1 ? "border-indigo-500" : "border-transparent")}>
                                <CardHeader className="p-4">
                                    <CardTitle className="text-sm">Team {captains[1].name}</CardTitle>
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
                                {currentTurn === 0 ? captains[0].name : captains[1].name}'s Turn
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
                                    onClick={() => setPhase("result")}
                                >
                                    View Final Teams
                                </Button>
                            </div>
                        )}
                    </>
                )}

                {phase === "result" && (
                    <div className="space-y-6">
                        <Card className="bg-indigo-50 border-indigo-100">
                            <CardHeader>
                                <CardTitle className="text-indigo-900">Team {captains[0].name}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="list-disc pl-5 space-y-1">
                                    {team1.map((p) => (
                                        <li key={p.id}>{p.name}</li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="bg-purple-50 border-purple-100">
                            <CardHeader>
                                <CardTitle className="text-purple-900">Team {captains[1].name}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="list-disc pl-5 space-y-1">
                                    {team2.map((p) => (
                                        <li key={p.id}>{p.name}</li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>

                        <Link href="/tournament">
                            <Button className="w-full" disabled>Start Tournament (Coming Soon)</Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
