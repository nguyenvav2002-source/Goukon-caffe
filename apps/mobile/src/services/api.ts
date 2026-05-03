import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { storage } from './storage';

// ─────────────────────────────────────────────
// Shared Types
// ─────────────────────────────────────────────
export type EventType = 'ONE_VS_ONE' | 'THREE_VS_THREE' | 'FIVE_VS_FIVE';
export type EventStatus = 'OPEN' | 'FULL' | 'ONGOING' | 'DONE' | 'CANCELLED';
export type RegistrationStatus = 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CANCELLED';
export type OrderStatus = 'PENDING' | 'PREPARING' | 'SERVED' | 'CANCELLED';
export type MatchStatus = 'PENDING' | 'MATCHED' | 'NOT_MATCHED';

export interface Event {
  id: string;
  title: string;
  description?: string;
  eventType: EventType;
  status: EventStatus;
  price: string;
  scheduledAt: string;
  durationMin: number;
  maxSlots: number;
  _count: { registrations: number };
}

export interface EventRegistration {
  id: string;
  status: RegistrationStatus;
  freedrink: boolean;
  createdAt: string;
  event: {
    id: string;
    title: string;
    eventType: EventType;
    scheduledAt: string;
    status: EventStatus;
  };
}

export interface MenuItem {
  id: string;
  name: string;
  basePrice: string;
  category: string;
  imageUrl?: string;
}

export interface Order {
  id: string;
  status: OrderStatus;
  note?: string;
  finalAmount: string;
  createdAt: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  quantity: number;
  finalPrice: string;
  isFree: boolean;
  menuItem: { name: string; category: string };
}

export interface Match {
  id: string;
  status: MatchStatus;
  choices: {
    userId: string;
    choice: 'HEART' | 'REJECT';
    user: { displayName: string };
  }[];
  photo?: { fileUrl: string };
}

export interface CreateOrderDto {
  sessionId: string;
  items: { menuItemId: string; quantity: number }[];
  note?: string;
}

// ─────────────────────────────────────────────
// Axios Instance
// ─────────────────────────────────────────────

// On web (browser), host.docker.internal is not resolvable → use localhost.
// On native, use the configured LAN IP from env / app config.
const BASE_URL =
  Platform.OS === 'web'
    ? 'http://localhost:3000'
    : (process.env.EXPO_PUBLIC_API_URL ??
        Constants.expoConfig?.extra?.apiBaseUrl ??
        'http://localhost:3000');

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request
api.interceptors.request.use(async (config) => {
  const token = await storage.getItemAsync('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await storage.getItemAsync('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');
        const res = await axios.post(`${BASE_URL}/api/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = res.data;
        await storage.setItemAsync('accessToken', accessToken);
        await storage.setItemAsync('refreshToken', newRefreshToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch {
        try { await storage.deleteItemAsync('accessToken'); } catch {}
        try { await storage.deleteItemAsync('refreshToken'); } catch {}
      }
    }
    return Promise.reject(error);
  },
);

// ─────────────────────────────────────────────
// Service: Events
// ─────────────────────────────────────────────
export const eventsApi = {
  list: (params?: { status?: EventStatus; type?: EventType }) =>
    api.get<Event[]>('/api/events', { params }).then((r) => r.data),

  get: (id: string) =>
    api.get<Event & { sessions: any[] }>(`/api/events/${id}`).then((r) => r.data),

  register: (eventId: string) =>
    api.post(`/api/events/${eventId}/register`).then((r) => r.data),

  checkIn: (registrationId: string) =>
    api.post(`/api/events/registrations/${registrationId}/check-in`).then((r) => r.data),

  myRegistrations: () =>
    api.get<EventRegistration[]>('/api/events/my/registrations').then((r) => r.data),
};

// ─────────────────────────────────────────────
// Service: Orders
// ─────────────────────────────────────────────
export const ordersApi = {
  menu: () =>
    api.get<MenuItem[]>('/api/orders/menu').then((r) => r.data),

  create: (dto: CreateOrderDto) =>
    api.post('/api/orders', dto).then((r) => r.data),

  myOrders: () =>
    api.get<Order[]>('/api/orders/my').then((r) => r.data),

  sessionOrders: (sessionId: string) =>
    api.get<Order[]>(`/api/orders/session/${sessionId}`).then((r) => r.data),

  updateStatus: (orderId: string, status: OrderStatus) =>
    api.patch(`/api/orders/${orderId}/status`, { status }).then((r) => r.data),
};

// ─────────────────────────────────────────────
// Service: Matches
// ─────────────────────────────────────────────
export const matchesApi = {
  submitChoice: (matchId: string, choice: 'HEART' | 'REJECT') =>
    api.post('/api/matches/choice', { matchId, choice }).then((r) => r.data),

  getStatus: (matchId: string) =>
    api.get<Match>(`/api/matches/${matchId}/status`).then((r) => r.data),

  sessionResults: (sessionId: string) =>
    api.get<Match[]>(`/api/matches/session/${sessionId}/results`).then((r) => r.data),
};

// ─────────────────────────────────────────────
// Service: Photos
// ─────────────────────────────────────────────
export const photosApi = {
  upload: (matchId: string, formData: FormData) =>
    api.post(`/api/photos/match/${matchId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data),

  list: (matchId: string) =>
    api.get(`/api/photos/match/${matchId}`).then((r) => r.data),
};

// ─────────────────────────────────────────────
// Service: Users
// ─────────────────────────────────────────────
export const usersApi = {
  me: () =>
    api.get('/api/users/me').then((r) => r.data),
};

export default api;

