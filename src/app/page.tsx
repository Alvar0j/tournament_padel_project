import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Users, Shield, Shuffle } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-4 text-slate-50">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            Padel Manager
          </h1>
          <p className="text-slate-400">
            Organize your tournaments with ease.
          </p>
        </div>

        <div className="grid gap-4">
          <Link href="/players" className="w-full">
            <Button
              variant="outline"
              className="h-auto w-full flex-col gap-2 border-slate-800 bg-slate-900 p-6 hover:bg-slate-800 hover:text-slate-50"
            >
              <Users className="h-8 w-8 text-blue-400" />
              <span className="text-lg font-semibold">Manage Players</span>
              <span className="text-xs text-slate-400">
                Add or remove players
              </span>
            </Button>
          </Link>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-950 px-2 text-slate-500">
                Start Tournament
              </span>
            </div>
          </div>

          <Link href="/captains" className="w-full">
            <Button
              className="h-auto w-full flex-col gap-2 bg-gradient-to-br from-indigo-500 to-purple-600 p-6 hover:from-indigo-600 hover:to-purple-700"
            >
              <Shield className="h-8 w-8" />
              <span className="text-lg font-semibold">Captains Mode</span>
              <span className="text-xs opacity-80">
                Captains draft their teams
              </span>
            </Button>
          </Link>

          <Link href="/balanced" className="w-full">
            <Button
              className="h-auto w-full flex-col gap-2 bg-gradient-to-br from-emerald-500 to-teal-600 p-6 hover:from-emerald-600 hover:to-teal-700"
            >
              <Shuffle className="h-8 w-8" />
              <span className="text-lg font-semibold">Balanced Mode</span>
              <span className="text-xs opacity-80">
                Top players paired with others
              </span>
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
