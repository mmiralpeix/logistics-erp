import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('auth_token') || (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      Cookies.remove('auth_token');
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  },
);

export default api;

// Typed API functions
export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  getProfile: () => api.get('/auth/profile'),
  changePassword: (currentPassword: string, newPassword: string) => api.patch('/auth/change-password', { currentPassword, newPassword }),
};

export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getRecentTrips: (limit?: number) => api.get('/dashboard/recent-trips', { params: { limit } }),
  getMonthlyChart: () => api.get('/dashboard/monthly-chart'),
  getExpiringAlerts: () => api.get('/dashboard/expiring-alerts'),
  getTripDistribution: () => api.get('/dashboard/trip-distribution'),
  getTripStatusDistribution: () => api.get('/dashboard/trip-distribution'),
};

export const clientsApi = {
  getAll: (params?: any) => api.get('/clients', { params }),
  getOne: (id: string) => api.get(`/clients/${id}`),
  create: (data: any) => api.post('/clients', data),
  update: (id: string, data: any) => api.patch(`/clients/${id}`, data),
  remove: (id: string) => api.delete(`/clients/${id}`),
  getHistory: (id: string) => api.get(`/clients/${id}/history`),
  getContracts: (id: string) => api.get(`/clients/${id}/contracts`),
  createContract: (id: string, data: any) => api.post(`/clients/${id}/contracts`, data),
};

export const vehiclesApi = {
  getAll: (params?: any) => api.get('/vehicles', { params }),
  getOne: (id: string) => api.get(`/vehicles/${id}`),
  create: (data: any) => api.post('/vehicles', data),
  update: (id: string, data: any) => api.patch(`/vehicles/${id}`, data),
  updateStatus: (id: string, status: string) => api.patch(`/vehicles/${id}/status`, { status }),
  remove: (id: string) => api.delete(`/vehicles/${id}`),
  getExpiring: () => api.get('/vehicles/expiring'),
  getAvailable: (date?: string) => api.get('/vehicles/available', { params: { date } }),
};

export const driversApi = {
  getAll: (params?: any) => api.get('/drivers', { params }),
  getOne: (id: string) => api.get(`/drivers/${id}`),
  create: (data: any) => api.post('/drivers', data),
  update: (id: string, data: any) => api.patch(`/drivers/${id}`, data),
  remove: (id: string) => api.delete(`/drivers/${id}`),
  getExpiring: () => api.get('/drivers/expiring-licenses'),
  getAvailable: (date?: string) => api.get('/drivers/available', { params: { date } }),
  addTraining: (id: string, data: any) => api.post(`/drivers/${id}/trainings`, data),
};

export const tripsApi = {
  getAll: (params?: any) => api.get('/trips', { params }),
  getOne: (id: string) => api.get(`/trips/${id}`),
  create: (data: any) => api.post('/trips', data),
  update: (id: string, data: any) => api.patch(`/trips/${id}`, data),
  updateStatus: (id: string, status: string, notes?: string) => api.patch(`/trips/${id}/status`, { status, notes }),
  addCost: (id: string, data: any) => api.post(`/trips/${id}/costs`, data),
  getGantt: (from: string, to: string) => api.get('/trips/gantt', { params: { from, to } }),
  reschedule: (id: string, newDeparture: string, reason: string) => api.patch(`/trips/${id}/reschedule`, { newDeparture, reason }),
};

export const maintenanceApi = {
  getAll: (params?: any) => api.get('/maintenance', { params }),
  getOne: (id: string) => api.get(`/maintenance/${id}`),
  create: (data: any) => api.post('/maintenance', data),
  update: (id: string, data: any) => api.patch(`/maintenance/${id}`, data),
  remove: (id: string) => api.delete(`/maintenance/${id}`),
  getUpcoming: () => api.get('/maintenance/upcoming'),
};

export const fuelApi = {
  getAll: (params?: any) => api.get('/fuel', { params }),
  create: (data: any) => api.post('/fuel', data),
  getStats: (params?: any) => api.get('/fuel/stats', { params }),
  getDeviations: () => api.get('/fuel/deviations'),
};

export const billingApi = {
  getAll: (params?: any) => api.get('/billing/invoices', { params }),
  getOne: (id: string) => api.get(`/billing/invoices/${id}`),
  create: (data: any) => api.post('/billing/invoices', data),
  updateStatus: (id: string, status: string) => api.patch(`/billing/invoices/${id}/status`, { status }),
  getStats: () => api.get('/billing/invoices/stats'),
  getOverdue: () => api.get('/billing/invoices/overdue'),
  createFromTrip: (data: any) => api.post('/billing/invoices/from-trip', data),
};

export const reportsApi = {
  downloadTripsExcel: (from: string, to: string) => api.get('/reports/trips/excel', { params: { from, to }, responseType: 'blob' }),
  downloadFleetExcel: () => api.get('/reports/fleet/excel', { responseType: 'blob' }),
  downloadFuelExcel: (from: string, to: string) => api.get('/reports/fuel/excel', { params: { from, to }, responseType: 'blob' }),
};

export const gpsApi = {
  getPositions: () => api.get('/gps/positions'),
  getDevices: () => api.get('/gps/devices'),
};

export const usersApi = {
  getAll: () => api.get('/users'),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.patch(`/users/${id}`, data),
  toggle: (id: string) => api.patch(`/users/${id}/toggle`),
};

export const dangerousGoodsApi = {
  getAll: (params?: any) => api.get('/dangerous-goods', { params }),
  getOne: (id: string) => api.get(`/dangerous-goods/${id}`),
  getClases: () => api.get('/dangerous-goods/clases'),
  checkCompliance: (tripId: string) => api.get(`/dangerous-goods/compliance-check/${tripId}`),
  update: (id: string, data: any) => api.patch(`/dangerous-goods/${id}`, data),
  approve: (id: string) => api.patch(`/dangerous-goods/${id}/approve`),
};

export const mfaApi = {
  generate: () => api.post('/auth/mfa/generate'),
  enable: (totpToken: string) => api.post('/auth/mfa/enable', { totpToken }),
  disable: (currentPassword: string) => api.post('/auth/mfa/disable', { currentPassword }),
};

export { api };

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
