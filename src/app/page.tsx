"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Users, Shield, Shuffle, Play, Trash2 } from "lucide-react";
import { useTournamentStore } from "@/store/useTournamentStore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const router = useRouter();
  const { matches, pairs, resetTournament } = useTournamentStore();
  const [hasActiveTournament, setHasActiveTournament] = useState(false);

  useEffect(() => {
    // Hydration fix: check store after mount
    setHasActiveTournament(matches.length > 0 || pairs.length > 0);
  }, [matches, pairs]);

  const handleStartNew = (href: string) => {
    if (hasActiveTournament) {
      if (confirm("Starting a new tournament will erase the current one. Are you sure?")) {
        resetTournament();
        router.push(href);
      }
    } else {
      router.push(href);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-4 text-slate-50">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            Comunión De Gregorio Tournament
          </h1>
          <p className="text-slate-400">
            I Campeonato de Padel de Comunión De Gregorio
          </p>
        </div>

        {hasActiveTournament && (
          <div className="rounded-lg border border-emerald-500/50 bg-emerald-950/30 p-4">
            <h3 className="mb-2 font-semibold text-emerald-400">Torneo Activo</h3>
            <div className="flex gap-2">
              <Link href="/tournament" className="flex-1">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                  <Play className="mr-2 h-4 w-4" /> Continuar
                </Button>
              </Link>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => {
                  if (confirm("Delete current tournament?")) resetTournament();
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <div className="grid gap-4">
          <Link href="/players" className="w-full">
            <Button
              variant="outline"
              className="h-auto w-full flex-col gap-2 border-slate-800 bg-slate-900 p-6 hover:bg-slate-800 hover:text-slate-50"
            >
              <Users className="h-8 w-8 text-blue-400" />
              <span className="text-lg font-semibold">Gestionar Jugadores</span>
              <span className="text-xs text-slate-400">
                Añadir o eliminar jugadores
              </span>
            </Button>
          </Link>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-950 px-2 text-slate-500">
                Iniciar nuevo torneo
              </span>
            </div>
          </div>

          <Button
            className="h-auto w-full flex-col gap-2 bg-gradient-to-br from-indigo-500 to-purple-600 p-6 hover:from-indigo-600 hover:to-purple-700"
            onClick={() => handleStartNew("/captains")}
          >
            <Shield className="h-8 w-8" />
            <span className="text-lg font-semibold">Modo Capitanes</span>
            <span className="text-xs opacity-80">
              Los capitanes forman sus equipos
            </span>
          </Button>

          <Button
            className="h-auto w-full flex-col gap-2 bg-gradient-to-br from-emerald-500 to-teal-600 p-6 hover:from-emerald-600 hover:to-teal-700"
            onClick={() => handleStartNew("/balanced")}
          >
            <Shuffle className="h-8 w-8" />
            <span className="text-lg font-semibold"> Modo Balanceado</span>
            <span className="text-xs opacity-80">
              Los mejores jugadores se pegan con otros
            </span>
          </Button>
        </div>
      </div>
    </main>
  );
}
