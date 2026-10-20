import type { BookingStatus } from '@/types';

export const STATUS_META: Record<
  BookingStatus,
  { label: string; color: string; icon: 'checkmark-circle' | 'time' | 'close-circle' | 'eye-off' }
> = {
  confirmed: { label: 'Confirmed', color: '#0369A1', icon: 'time' },
  completed: { label: 'Completed', color: '#047857', icon: 'checkmark-circle' },
  cancelled: { label: 'Cancelled', color: '#DC2626', icon: 'close-circle' },
  'no-show': { label: 'No-show', color: '#B45309', icon: 'eye-off' },
};
