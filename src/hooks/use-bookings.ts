import { useEffect, useMemo, useState } from 'react';

import type { Booking, Client, Service } from '@/types';

import { MINUTE, isSameDay } from '@/lib/date';
import { useBookingStore } from '@/store/booking-store';

export interface BookingView extends Booking {
  service: Service;
  client: Client;
  startDate: Date;
  endDate: Date;
}

const FALLBACK_SERVICE: Service = {
  id: 'unknown',
  name: 'Service',
  duration: 60,
  price: 0,
  colors: ['#64748B', '#A3A1BF'],
};

const FALLBACK_CLIENT: Client = { id: 'unknown', name: 'Walk-in', createdAt: '' };

export function useServiceMap() {
  const services = useBookingStore((s) => s.services);
  return useMemo(() => Object.fromEntries(services.map((s) => [s.id, s])), [services]);
}

export function useClientMap() {
  const clients = useBookingStore((s) => s.clients);
  return useMemo(() => Object.fromEntries(clients.map((c) => [c.id, c])), [clients]);
}

/** All bookings joined with their service and client, sorted by start time */
export function useBookingViews(): BookingView[] {
  const bookings = useBookingStore((s) => s.bookings);
  const services = useServiceMap();
  const clients = useClientMap();
  return useMemo(
    () =>
      bookings.map((b) => {
        const service = services[b.serviceId] ?? FALLBACK_SERVICE;
        const startDate = new Date(b.start);
        return {
          ...b,
          service,
          client: clients[b.clientId] ?? FALLBACK_CLIENT,
          startDate,
          endDate: new Date(startDate.getTime() + service.duration * MINUTE),
        };
      }),
    [bookings, services, clients],
  );
}

export function useBookingsForDay(day: Date) {
  const views = useBookingViews();
  const key = day.toDateString();
  return useMemo(
    () => views.filter((b) => isSameDay(b.startDate, day)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [views, key],
  );
}

export function useBookingView(id: string | undefined) {
  const views = useBookingViews();
  return useMemo(() => views.find((b) => b.id === id), [views, id]);
}

/** Re-renders every `intervalMs` so countdowns stay fresh */
export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}
