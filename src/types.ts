export type BookingStatus = 'confirmed' | 'completed' | 'cancelled' | 'no-show';

export interface Service {
  id: string;
  name: string;
  /** Minutes */
  duration: number;
  price: number;
  /** Two-stop gradient used across the UI for this service */
  colors: [string, string];
}

export interface Client {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  createdAt: string;
}

export interface Booking {
  id: string;
  clientId: string;
  serviceId: string;
  /** ISO timestamp */
  start: string;
  status: BookingStatus;
  notes?: string;
  createdAt: string;
}
