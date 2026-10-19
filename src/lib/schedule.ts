import type { Booking, Service } from '@/types';

import { MINUTE, atTime, toHHmm } from './date';

export const OPEN_HOUR = 8;
export const CLOSE_HOUR = 20;
export const SLOT_MINUTES = 30;

export function bookingEnd(booking: Booking, service: Service | undefined) {
  return new Date(new Date(booking.start).getTime() + (service?.duration ?? 60) * MINUTE);
}

/** True if [start, start+duration) overlaps no active booking */
export function isSlotFree(
  start: Date,
  duration: number,
  bookings: Booking[],
  services: Record<string, Service>,
  ignoreId?: string,
) {
  const s = start.getTime();
  const e = s + duration * MINUTE;
  return bookings.every((b) => {
    if (b.id === ignoreId || b.status === 'cancelled') return true;
    const bs = new Date(b.start).getTime();
    const be = bs + (services[b.serviceId]?.duration ?? 60) * MINUTE;
    return e <= bs || s >= be;
  });
}

export interface Slot {
  time: string;
  date: Date;
  available: boolean;
  past: boolean;
}

export function daySlots(
  day: Date,
  duration: number,
  bookings: Booking[],
  services: Record<string, Service>,
  ignoreId?: string,
  now = new Date(),
): Slot[] {
  const slots: Slot[] = [];
  const close = atTime(day, `${CLOSE_HOUR}:00`).getTime();
  for (let m = OPEN_HOUR * 60; m < CLOSE_HOUR * 60; m += SLOT_MINUTES) {
    const date = atTime(day, `${Math.floor(m / 60)}:${m % 60}`);
    const fits = date.getTime() + duration * MINUTE <= close;
    const past = date.getTime() < now.getTime();
    slots.push({
      time: toHHmm(date),
      date,
      past,
      available: fits && !past && isSlotFree(date, duration, bookings, services, ignoreId),
    });
  }
  return slots;
}
