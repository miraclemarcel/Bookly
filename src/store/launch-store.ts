import { create } from 'zustand';

interface LaunchState {
  /** True once the launch splash has played; unlocks the rest of the app */
  splashDone: boolean;
  finishSplash: () => void;
}

export const useLaunchStore = create<LaunchState>((set) => ({
  splashDone: false,
  finishSplash: () => set({ splashDone: true }),
}));
