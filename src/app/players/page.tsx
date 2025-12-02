"use client";

import { useState } from "react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Trash2, Users } from "lucide-react";
import Link from "next/link";

export default function PlayersPage() {
    const { players, addPlayer, removePlayer } = usePlayerStore();
    const [newPlayerName, setNewPlayerName] = useState("");

    const handleAddPlayer = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPlayerName.trim()) {
            addPlayer(newPlayerName.trim());
            setNewPlayerName("");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 pb-20">
            <div className="mx-auto max-w-md space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-slate-900">Players</h1>
                    <Link href="/">
                        <Button variant="ghost" size="sm">
                            Back
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Add New Player</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddPlayer} className="flex gap-2">
                            <Input
                                placeholder="Player Name"
                                value={newPlayerName}
                                onChange={(e) => setNewPlayerName(e.target.value)}
                            />
                            <Button type="submit">Add</Button>
                        </form>
                    </CardContent>
                </Card>

                <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-lg font-semibold text-slate-700">
                            Roster ({players.length})
                        </h2>
                        {players.length < 4 && (
                            <span className="text-xs text-amber-600">
                                Need at least 4 players
                            </span>
                        )}
                    </div>

                    {players.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">
                            <Users className="mb-2 h-8 w-8 opacity-50" />
                            <p>No players yet.</p>
                            <p className="text-sm">Add players to start a tournament.</p>
                        </div>
                    ) : (
                        <div className="grid gap-2">
                            {players.map((player) => (
                                <div
                                    key={player.id}
                                    className="flex items-center justify-between rounded-md border border-slate-200 bg-white p-3 shadow-sm"
                                >
                                    <span className="font-medium text-slate-900">
                                        {player.name}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-slate-400 hover:text-red-500"
                                        onClick={() => removePlayer(player.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
