import type { Booking, Client, Service } from '@/types';

import { addDays, atTime, startOfDay } from '@/lib/date';
import { uid } from '@/lib/id';
import { CLOSE_HOUR, OPEN_HOUR, isSlotFree } from '@/lib/schedule';

export const DEFAULT_SERVICES: Service[] = [
  { id: 'svc-cut', name: 'Signature Cut', emoji: '✂️', duration: 45, price: 65, colors: ['#8B5CF6', '#EC4899'] },
  { id: 'svc-color', name: 'Color Studio', emoji: '🎨', duration: 120, price: 180, colors: ['#F59E0B', '#FB7185'] },
  { id: 'svc-beard', name: 'Beard Sculpt', emoji: '🧔', duration: 30, price: 35, colors: ['#34D399', '#38BDF8'] },
  { id: 'svc-spa', name: 'Scalp Spa', emoji: '🌿', duration: 60, price: 90, colors: ['#10B981', '#84CC16'] },
  { id: 'svc-style', name: 'Event Styling', emoji: '✨', duration: 90, price: 140, colors: ['#38BDF8', '#8B5CF6'] },
  { id: 'svc-consult', name: 'Consultation', emoji: '💬', duration: 30, price: 0, colors: ['#64748B', '#A3A1BF'] },
];

const CLIENT_NAMES = [
  'Amara Okafor', 'Leo Brennan', 'Sofia Marquez', 'Kenji Watanabe', 'Priya Raman',
  'Noah Fischer', 'Zara Ahmed', 'Mateo Rossi', 'Chloe Dubois', 'Ezra Mensah',
  'Ivy Chen', 'Omar Haddad',
];

const NOTES = [
  'Prefers quiet appointments',
  'Allergic to lavender products',
  'Usually runs 5 min late ☕',
  'Bring reference photos',
  undefined,
  undefined,
  undefined,
];

/** Tiny seeded PRNG so the demo looks the same after each reset */
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

export function createSeed(now = new Date()) {
  const rand = rng(42);
  const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];

  const services = DEFAULT_SERVICES;
  const serviceMap = Object.fromEntries(services.map((s) => [s.id, s]));
  const clients: Client[] = CLIENT_NAMES.map((name, i) => ({
    id: `cl-${i}`,
    name,
    phone: `+1 (555) ${200 + i * 37}-${1000 + i * 731}`.slice(0, 19),
    email: `${name.split(' ')[0].toLowerCase()}@mail.com`,
    createdAt: addDays(now, -60 + i).toISOString(),
  }));

  const bookings: Booking[] = [];
  const today = startOfDay(now);

  for (let offset = -21; offset <= 14; offset++) {
    const day = addDays(today, offset);
    if (day.getDay() === 0) continue; // closed Sundays
    const target = offset === 0 ? 5 : 2 + Math.floor(rand() * 4);
    let placed = 0;
    for (let attempt = 0; placed < target && attempt < 40; attempt++) {
      const service = pick(services);
      const startMin =
        OPEN_HOUR * 60 + Math.floor(rand() * ((CLOSE_HOUR - OPEN_HOUR) * 2 - 1)) * 30;
      if (startMin + service.duration > CLOSE_HOUR * 60) continue;
      const start = atTime(day, `${Math.floor(startMin / 60)}:${startMin % 60}`);
      if (!isSlotFree(start, service.duration, bookings, serviceMap)) continue;

      const isPast = start.getTime() + service.duration * 60_000 < now.getTime();
      const roll = rand();
      const status: Booking['status'] = isPast
        ? roll < 0.82
          ? 'completed'
          : roll < 0.92
            ? 'no-show'
            : 'cancelled'
        : roll < 0.93
          ? 'confirmed'
          : 'cancelled';

      bookings.push({
        id: uid(),
        clientId: pick(clients).id,
        serviceId: service.id,
        start: start.toISOString(),
        status,
        notes: pick(NOTES),
        createdAt: addDays(start, -3).toISOString(),
      });
      placed++;
    }
  }

  bookings.sort((a, b) => a.start.localeCompare(b.start));
  return { services, clients, bookings };
}
