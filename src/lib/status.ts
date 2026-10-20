import type { BookingStatus } from '@/types';

export const STATUS_META: Record<
  BookingStatus,
  { label: string; color: string; icon: 'checkmark-circle' | 'time' | 'close-circle' | 'eye-off' }
> = {
  confirmed: { label: 'Confirmed', color: '#0284C7', icon: 'time' },
  completed: { label: 'Completed', color: '#059669', icon: 'checkmark-circle' },
  cancelled: { label: 'Cancelled', color: '#E11D48', icon: 'close-circle' },
  'no-show': { label: 'No-show', color: '#D97706', icon: 'eye-off' },
};
