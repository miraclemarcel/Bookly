import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Booking, BookingStatus, Client, Service } from '@/types';

import { uid } from '@/lib/id';

import { createSeed } from './seed';

interface BookingState {
  services: Service[];
  clients: Client[];
  bookings: Booking[];

  addBooking: (input: Omit<Booking, 'id' | 'createdAt' | 'status'>) => Booking;
  setStatus: (id: string, status: BookingStatus) => void;
  reschedule: (id: string, start: string) => void;
  removeBooking: (id: string) => void;
  addClient: (input: Pick<Client, 'name' | 'phone' | 'email'>) => Client;
  resetDemo: () => void;
  clearAll: () => void;
}

const sortByStart = (list: Booking[]) => [...list].sort((a, b) => a.start.localeCompare(b.start));

export const useBookingStore = create<BookingState>()(
  persist(
    (set) => ({
      ...createSeed(),

      addBooking: (input) => {
        const booking: Booking = {
          ...input,
          id: uid(),
          status: 'confirmed',
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ bookings: sortByStart([...s.bookings, booking]) }));
        return booking;
      },

      setStatus: (id, status) =>
        set((s) => ({ bookings: s.bookings.map((b) => (b.id === id ? { ...b, status } : b)) })),

      reschedule: (id, start) =>
        set((s) => ({
          bookings: sortByStart(
            s.bookings.map((b) => (b.id === id ? { ...b, start, status: 'confirmed' } : b)),
          ),
        })),

      removeBooking: (id) => set((s) => ({ bookings: s.bookings.filter((b) => b.id !== id) })),

      addClient: (input) => {
        const client: Client = { ...input, id: uid(), createdAt: new Date().toISOString() };
        set((s) => ({ clients: [...s.clients, client] }));
        return client;
      },

      resetDemo: () => set(createSeed()),

      clearAll: () => set({ bookings: [], clients: [] }),
    }),
    {
      name: 'bookly-store',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ services, clients, bookings }) => ({ services, clients, bookings }),
    },
  ),
);

/** Resolves once persisted state has been loaded from AsyncStorage */
export function useStoreHydrated() {
  return useSyncExternalStore(
    (onChange) => useBookingStore.persist.onFinishHydration(onChange),
    () => useBookingStore.persist.hasHydrated(),
    () => false,
  );
}
