/**
 * Freshers client state.
 * ----------------------
 * Holds user-specific freshers-season state that has no backend yet: quest
 * completion, Prom Radar opt-in, and the "We Met" list. Persisted to
 * localStorage via zustand so it survives reloads. When the real endpoints land
 * (see IMPLEMENTATION.md), these actions become thin API calls and the shape
 * stays the same.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PromMode = 'DATE' | 'GROUP';

export interface MetPerson {
  id: string;
  name: string;
  username: string;
  where: string;
  at: string; // ISO
}

interface FreshersState {
  completedQuests: string[];

  promOptIn: boolean;
  promMode: PromMode;
  promNote: string;

  met: MetPerson[];

  completeQuest: (id: string) => void;
  setProm: (opts: { optIn?: boolean; mode?: PromMode; note?: string }) => void;
  addMet: (p: MetPerson) => void;
  removeMet: (id: string) => void;
}

export const useFreshersStore = create<FreshersState>()(
  persist(
    (set) => ({
      completedQuests: [],
      promOptIn: false,
      promMode: 'GROUP',
      promNote: '',
      met: [],

      completeQuest: (id) =>
        set((s) => (s.completedQuests.includes(id) ? s : { completedQuests: [...s.completedQuests, id] })),

      setProm: (opts) => set((s) => ({
        promOptIn: opts.optIn ?? s.promOptIn,
        promMode: opts.mode ?? s.promMode,
        promNote: opts.note ?? s.promNote,
      })),

      addMet: (p) => set((s) => (s.met.some((m) => m.id === p.id) ? s : { met: [p, ...s.met] })),
      removeMet: (id) => set((s) => ({ met: s.met.filter((m) => m.id !== id) })),
    }),
    { name: 'origo-freshers' },
  ),
);
