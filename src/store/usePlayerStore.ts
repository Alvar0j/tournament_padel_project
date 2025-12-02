import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Player {
    id: string;
    name: string;
}

interface PlayerState {
    players: Player[];
    addPlayer: (name: string) => void;
    removePlayer: (id: string) => void;
    editPlayer: (id: string, name: string) => void;
}

export const usePlayerStore = create<PlayerState>()(
    persist(
        (set) => ({
            players: [],
            addPlayer: (name) =>
                set((state) => ({
                    players: [
                        ...state.players,
                        { id: Math.random().toString(36).substring(7), name },
                    ],
                })),
            removePlayer: (id) =>
                set((state) => ({
                    players: state.players.filter((p) => p.id !== id),
                })),
            editPlayer: (id, name) =>
                set((state) => ({
                    players: state.players.map((p) =>
                        p.id === id ? { ...p, name } : p
                    ),
                })),
        }),
        {
            name: 'padel-player-storage',
        }
    )
);
