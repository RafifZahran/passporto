import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:8080/api/v1';

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request if available
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('passporto_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    
    // Developer bypass for admin panel simulation
    const adminUnlocked = sessionStorage.getItem('passporto_admin_unlocked') === 'true';
    if (adminUnlocked) config.headers['X-Developer-Secret'] = 'admin12345';
  }
  return config;
});

// Redirect to login on 401, but NOT when admin panel is unlocked (uses X-Developer-Secret bypass)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      const adminUnlocked = sessionStorage.getItem('passporto_admin_unlocked') === 'true';
      if (!adminUnlocked) {
        localStorage.removeItem('passporto_token');
        localStorage.removeItem('passporto_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (email: string, password: string) =>
    api.post('/auth/register', { email, password }),

  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  me: () => api.get('/auth/me'),

  validateNIK: (nik: string) =>
    api.post('/auth/validate-nik', { nik }),

  updateProfile: (full_name: string) =>
    api.patch('/auth/profile', { full_name }),
};

// ── Offices & Slots ───────────────────────────────────────────────────────────
export const officesApi = {
  getSlotPredictions: (officeID: string, fromDate: string, toDate: string) =>
    api.get(`/offices/${officeID}/slots`, {
      params: { from_date: fromDate, to_date: toDate },
    }),
};

// ── Applications ──────────────────────────────────────────────────────────────
export const applicationsApi = {
  create: (data: {
    office_id: string;
    slot_date: string;
    nik: string;
    full_name: string;
    birth_date: string;
    gender: string;
    address: string;
  }) => api.post('/applications', data),

  getAll: () => api.get('/applications'),

  getOne: (id: string) => api.get(`/applications/${id}`),

  updateStatus: (id: string, status: string) => api.patch(`/applications/${id}/status`, { status }),
};

// ── Waitlist ──────────────────────────────────────────────────────────────────
export const waitlistApi = {
  join: (office_id: string, date: string) =>
    api.post('/waitlist', { office_id, date }),
};

// ── Payments ──────────────────────────────────────────────────────────────────
export const paymentsApi = {
  initiate: (application_id: string, amount: number) =>
    api.post('/payments', { application_id, amount }),

  getByApplication: (applicationId: string) =>
    api.get(`/payments/${applicationId}`),
};

// ── Check-in ──────────────────────────────────────────────────────────────────
export const checkInApi = {
  checkIn: (application_id: string, latitude: number, longitude: number) =>
    api.post('/checkin', { application_id, latitude, longitude }),
};

// ── Officer / Admin Management ────────────────────────────────────────────────
export const officerApi = {
  getAllApplications: () => api.get('/officer/applications'),
  getAllUsers: () => api.get('/officer/users'),
  updateUserRole: (id: string, role: string) => api.patch(`/officer/users/${id}/role`, { role }),
};
