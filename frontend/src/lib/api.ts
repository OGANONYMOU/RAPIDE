import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_PREFIX = '/api/v1';
const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || '';
const API_BASE_URL = `${API_ORIGIN}${API_PREFIX}`;

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ─── Attach access token to every request ────────────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;

    const lang = localStorage.getItem('rapide_lang') || 'fr';
    config.headers['Accept-Language'] = lang;
  }
  return config;
});

// ─── Auto-refresh on 401 ──────────────────────────────────────────────────────
let isRefreshing = false;
let failedQueue: { resolve: (v: unknown) => void; reject: (e: unknown) => void }[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        isRefreshing = false;
        if (typeof window !== 'undefined') window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefresh } = data.data;
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', newRefresh);
        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        if (typeof window !== 'undefined') window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ─── Typed API helpers ────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: Record<string, unknown>) =>
    api.post('/auth/register', data),
  refreshToken: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, newPassword: string) =>
    api.post('/auth/reset-password', { token, newPassword }),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data: Record<string, unknown>) =>
    api.patch('/auth/me', data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.patch('/auth/me/password', { currentPassword, newPassword }),
};

export const ordersApi = {
  create: (data: Record<string, unknown>) => api.post('/orders', data),
  list: (params?: Record<string, unknown>) => api.get('/orders', { params }),
  get: (id: string) => api.get(`/orders/${id}`),
  updateStatus: (id: string, status: string, note?: string) =>
    api.patch(`/orders/${id}/status`, { status, note }),
  cancel: (id: string, reason?: string) =>
    api.patch(`/orders/${id}/cancel`, { reason }),
  rate: (id: string, score: number, comment?: string) =>
    api.post(`/orders/${id}/rating`, { score, comment }),
  getChat: (id: string) => api.get(`/orders/${id}/chat`),
  sendMessage: (id: string, message: string) =>
    api.post(`/orders/${id}/chat`, { message }),
};

export const pricingApi = {
  estimate: (data: Record<string, unknown>) =>
    api.post('/pricing/estimate', data),
};

export const paymentsApi = {
  getWallet: () => api.get('/payments/wallet'),
  topup: (amount: number) => api.post('/payments/wallet/topup', { amount }),
  payWithWallet: (orderId: string) =>
    api.post(`/payments/orders/${orderId}/pay-wallet`),
};

export const driverApi = {
  getProfile: () => api.get('/drivers/me'),
  updateProfile: (data: Record<string, unknown>) =>
    api.patch('/drivers/me', data),
  uploadDocuments: (formData: FormData) =>
    api.post('/drivers/me/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getEarnings: (period?: string) =>
    api.get('/drivers/me/earnings', { params: { period } }),
  getDeliveries: (params?: Record<string, unknown>) =>
    api.get('/drivers/me/deliveries', { params }),
  setOnlineStatus: (isOnline: boolean) =>
    api.patch('/drivers/me/status', { isOnline }),
};

export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getAnalytics: (period?: string) =>
    api.get('/admin/analytics', { params: { period } }),
  listUsers: (params?: Record<string, unknown>) =>
    api.get('/admin/users', { params }),
  updateUserStatus: (id: string, status: string) =>
    api.patch(`/admin/users/${id}/status`, { status }),
  listDrivers: (params?: Record<string, unknown>) =>
    api.get('/admin/drivers', { params }),
  approveDriver: (id: string) => api.post(`/admin/drivers/${id}/approve`),
  rejectDriver: (id: string, reason: string) =>
    api.post(`/admin/drivers/${id}/reject`, { reason }),
  listOrders: (params?: Record<string, unknown>) =>
    api.get('/admin/orders', { params }),
  getPricingRules: () => api.get('/admin/pricing'),
  upsertPricingRule: (vehicleType: string, data: Record<string, unknown>) =>
    api.put(`/admin/pricing/${vehicleType}`, data),
  listPromoCodes: () => api.get('/admin/promos'),
  createPromoCode: (data: Record<string, unknown>) =>
    api.post('/admin/promos', data),
  togglePromoCode: (id: string) => api.patch(`/admin/promos/${id}/toggle`),
  listSupportTickets: (params?: Record<string, unknown>) =>
    api.get('/admin/support', { params }),
  resolveTicket: (id: string) => api.patch(`/admin/support/${id}/resolve`),
};

export const notificationsApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/notifications', { params }),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

export const supportApi = {
  list: () => api.get('/support'),
  create: (data: Record<string, unknown>) => api.post('/support', data),
  get: (id: string) => api.get(`/support/${id}`),
  sendMessage: (id: string, message: string) =>
    api.post(`/support/${id}/messages`, { message }),
};

export const trackingApi = {
  getOrderTracking: (orderId: string) =>
    api.get(`/tracking/orders/${orderId}`),
};

export const usersApi = {
  getSavedAddresses: () => api.get('/users/saved-addresses'),
  createSavedAddress: (data: Record<string, unknown>) =>
    api.post('/users/saved-addresses', data),
  deleteSavedAddress: (id: string) =>
    api.delete(`/users/saved-addresses/${id}`),
};

export const getApiErrorMessage = (
  error: unknown,
  fallback = 'Une erreur serveur est survenue.'
) => {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return 'Le backend est indisponible. Lancez l API sur http://localhost:4000 et assurez-vous que PostgreSQL tourne.';
    }

    const data = error.response.data as { message?: string } | string | undefined;
    const message = typeof data === 'object' && data ? data.message : undefined;

    if (error.response.status >= 500 && !message) {
      return 'Le backend ne repond pas encore. Verifiez que le serveur backend a bien demarre sur le port 4000.';
    }

    return message || fallback;
  }

  return fallback;
};
