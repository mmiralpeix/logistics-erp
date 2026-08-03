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
  login: (email: string, password: string, totpToken?: string) => api.post('/auth/login', { email, password, totpToken }),
  register: (data: { email: string; password: string; firstName: string; lastName: string; phone?: string }) => api.post('/auth/register', data),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  activateAccount: (token: string) => api.post('/auth/activate', { token }),
  resetPassword: (token: string, newPassword: string) => api.post('/auth/reset-password', { token, newPassword }),
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
  getVehicleConsumptionChart: () => api.get('/dashboard/vehicle-consumption'),
};

export const alertsApi = {
  getActiveAlerts: (params?: any) => api.get('/alerts/active', { params }),
  getStats: () => api.get('/alerts/stats'),
  evaluateAll: () => api.post('/alerts/evaluate-all'),
  resolveAlert: (id: string, nota?: string) => api.patch(`/alerts/${id}/resolve`, { nota }),
  silenceAlert: (id: string, dias?: number) => api.patch(`/alerts/${id}/silence`, { dias }),
  getPreferences: () => api.get('/alerts/preferences'),
  updatePreferences: (data: any) => api.patch('/alerts/preferences', data),
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
  getSummary360: (id: string) => api.get(`/clients/${id}/summary-360`),
  getRates: (id: string) => api.get(`/clients/${id}/rates`),
  addRate: (id: string, data: any) => api.post(`/clients/${id}/rates`, data),
  removeRate: (rateId: string) => api.delete(`/clients/rates/${rateId}`),
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
  getSummary360: (id: string) => api.get(`/vehicles/${id}/summary-360`),
  updateOdometer: (id: string, data: { kilometraje: number; horasMotor?: number }) => api.patch(`/vehicles/${id}/odometer`, data),
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
  getSchedule: (params?: any) => api.get('/drivers/schedule', { params }),
  getScheduleKpis: () => api.get('/drivers/schedule/kpis'),
  recordShiftEvent: (id: string, data: any) => api.post(`/drivers/${id}/shift-event`, data),
  getShiftHistory: (id: string) => api.get(`/drivers/${id}/shift-history`),
  updateScheduleConfig: (id: string, data: any) => api.patch(`/drivers/${id}/schedule-config`, data),
  exportScheduleReport: (params?: any) => api.get('/drivers/schedule/export', { params }),
};

export const tripsApi = {
  getAll: (params?: any) => api.get('/trips', { params }),
  getOne: (id: string) => api.get(`/trips/${id}`),
  create: (data: any) => api.post('/trips', data),
  createBatch: (data: any) => api.post('/trips/batch', data),
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
  getHealthStats: () => api.get('/maintenance/health-stats'),
  getCosts: () => api.get('/maintenance/costs-by-vehicle'),
};

export const sparePartsApi = {
  getAll: (params?: any) => api.get('/maintenance/spare-parts', { params }),
  getOne: (id: string) => api.get(`/maintenance/spare-parts/${id}`),
  create: (data: any) => api.post('/maintenance/spare-parts', data),
  update: (id: string, data: any) => api.patch(`/maintenance/spare-parts/${id}`, data),
  adjustStock: (id: string, delta: number) => api.patch(`/maintenance/spare-parts/${id}/stock`, { delta }),
  remove: (id: string) => api.delete(`/maintenance/spare-parts/${id}`),
  getLowStock: () => api.get('/maintenance/spare-parts/low-stock'),
};

export const tiresApi = {
  getAll: (params?: any) => api.get('/maintenance/tires', { params }),
  getKPIs: () => api.get('/maintenance/tires/kpis'),
  getVehiclePositions: (vehicleId: string) => api.get(`/maintenance/tires/vehicle/${vehicleId}/positions`),
  getOne: (id: string) => api.get(`/maintenance/tires/${id}`),
  create: (data: any) => api.post('/maintenance/tires', data),
  update: (id: string, data: any) => api.patch(`/maintenance/tires/${id}`, data),
  install: (id: string, data: any) => api.post(`/maintenance/tires/${id}/install`, data),
  dismount: (id: string, data: any) => api.post(`/maintenance/tires/${id}/dismount`, data),
  rotate: (data: any) => api.post('/maintenance/tires/rotate', data),
  sendToRetread: (id: string, data: any) => api.post(`/maintenance/tires/${id}/retread`, data),
  receiveFromRetread: (id: string, data: any) => api.post(`/maintenance/tires/${id}/retread/receive`, data),
  recordInspection: (id: string, data: any) => api.post(`/maintenance/tires/${id}/inspection`, data),
  retire: (id: string, motivo: string) => api.post(`/maintenance/tires/${id}/retire`, { motivo }),
  exportReport: (params?: any) => api.get('/maintenance/tires/export', { params }),
};

export const consumablesApi = {
  getAll: (params?: any) => api.get('/consumables', { params }),
  create: (data: any) => api.post('/consumables', data),
  getStats: (params?: any) => api.get('/consumables/stats', { params }),
  getDeviations: () => api.get('/consumables/deviations'),
};

export const fuelApi = consumablesApi;

export const billingApi = {
  getAll: (params?: any) => api.get('/billing/invoices', { params }),
  getOne: (id: string) => api.get(`/billing/invoices/${id}`),
  create: (data: any) => api.post('/billing/invoices', data),
  updateStatus: (id: string, status: string) => api.patch(`/billing/invoices/${id}/status`, { status }),
  getStats: () => api.get('/billing/invoices/stats'),
  getOverdue: () => api.get('/billing/invoices/overdue'),
  createFromTrip: (data: any) => api.post('/billing/invoices/from-trip', data),
};

export const certificationsApi = {
  getAll: (params?: any) => api.get('/certifications', { params }),
  getUncertifiedTrips: (clientId?: string) => api.get('/certifications/uncertified-trips', { params: { clientId } }),
  getOne: (id: string) => api.get(`/certifications/${id}`),
  create: (data: any) => api.post('/certifications', data),
  update: (id: string, data: any) => api.patch(`/certifications/${id}`, data),
  remove: (id: string) => api.delete(`/certifications/${id}`),
};

export const analyticsApi = {
  getKpis: (params?: any) => api.get('/analytics/kpis', { params }),
  getComparative: (params?: any) => api.get('/analytics/comparative', { params }),
  getPredictive: () => api.get('/analytics/predictions'),
  getVehicleRanking: () => api.get('/analytics/vehicle-ranking'),
  exportAnalyticsExcel: () => api.get('/analytics/export', { responseType: 'blob' }),
};

export const reportsApi = {
  getTemplates: () => api.get('/reports/templates'),
  createTemplate: (data: any) => api.post('/reports/templates', data),
  getSavedReports: () => api.get('/reports/saved'),
  saveReport: (data: any) => api.post('/reports/saved', data),
  toggleFavoriteSavedReport: (id: string) => api.patch(`/reports/saved/${id}/favorite`),
  getSchedules: () => api.get('/reports/schedules'),
  createSchedule: (data: any) => api.post('/reports/schedules', data),
  toggleSchedule: (id: string) => api.patch(`/reports/schedules/${id}/toggle`),
  getExecutiveSummary: (params?: any) => api.get('/reports/executive-summary', { params }),
  generateReportData: (params?: any) => api.get('/reports/generate-data', { params }),
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
  getDashboardConfig: () => api.get('/users/me/dashboard-config'),
  updateDashboardConfig: (config: any) => api.patch('/users/me/dashboard-config', config),
};

export const dangerousGoodsApi = {
  getAll: (params?: any) => api.get('/dangerous-goods', { params }),
  getOne: (id: string) => api.get(`/dangerous-goods/${id}`),
  getClases: () => api.get('/dangerous-goods/clases'),
  checkCompliance: (tripId: string) => api.get(`/dangerous-goods/compliance-check/${tripId}`),
  update: (id: string, data: any) => api.patch(`/dangerous-goods/${id}`, data),
  approve: (id: string) => api.patch(`/dangerous-goods/${id}/approve`),
};

export const carriersApi = {
  getAll: (params?: any) => api.get('/carriers', { params }),
  getOne: (id: string) => api.get(`/carriers/${id}`),
  create: (data: any) => api.post('/carriers', data),
  update: (id: string, data: any) => api.patch(`/carriers/${id}`, data),
  remove: (id: string) => api.delete(`/carriers/${id}`),
  // Vehicles
  getVehicles: (carrierId: string) => api.get(`/carriers/${carrierId}/vehicles`),
  createVehicle: (carrierId: string, data: any) => api.post(`/carriers/${carrierId}/vehicles`, data),
  updateVehicle: (vehicleId: string, data: any) => api.patch(`/carriers/vehicles/${vehicleId}`, data),
  removeVehicle: (vehicleId: string) => api.delete(`/carriers/vehicles/${vehicleId}`),
  // Drivers
  getDrivers: (carrierId: string) => api.get(`/carriers/${carrierId}/drivers`),
  createDriver: (carrierId: string, data: any) => api.post(`/carriers/${carrierId}/drivers`, data),
  updateDriver: (driverId: string, data: any) => api.patch(`/carriers/drivers/${driverId}`, data),
  removeDriver: (driverId: string) => api.delete(`/carriers/drivers/${driverId}`),
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
