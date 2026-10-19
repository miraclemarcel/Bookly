import type { BookingStatus } from '@/types';

export const STATUS_META: Record<
  BookingStatus,
  { label: string; color: string; icon: 'checkmark-circle' | 'time' | 'close-circle' | 'eye-off' }
> = {
  confirmed: { label: 'Confirmed', color: '#38BDF8', icon: 'time' },
  completed: { label: 'Completed', color: '#34D399', icon: 'checkmark-circle' },
  cancelled: { label: 'Cancelled', color: '#FB7185', icon: 'close-circle' },
  'no-show': { label: 'No-show', color: '#F59E0B', icon: 'eye-off' },
};
