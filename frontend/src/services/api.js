// Keep browser requests on the app origin by default so Vite can proxy them.
// Set VITE_API_URL only when the frontend and API are deployed separately.
const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('broom_token');
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers }
  });
  let payload;
  try {
    payload = await response.json();
  } catch {
    payload = { message: response.statusText || 'The server returned an unreadable response' };
  }
  if (response.status === 401) {
    localStorage.removeItem('broom_token');
    localStorage.removeItem('broom_user');
    window.dispatchEvent(new Event('broom:unauthorized'));
  }
  if (!response.ok) throw new Error(payload.message || 'Request failed');
  return payload;
}

export const api = {
  login: (credentials) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
  me: () => apiRequest('/auth/me'),
  inventory: () => apiRequest('/inventory'),
  inventoryItem: (id) => apiRequest(`/inventory/${id}`),
  openingStock: (data) => apiRequest('/inventory/opening-stock', { method: 'POST', body: JSON.stringify(data) }),
  washing: () => apiRequest('/washing'),
  createWashing: (data) => apiRequest('/washing', { method: 'POST', body: JSON.stringify(data) }),
  laborers: () => apiRequest('/laborers'),
  createLaborer: (data) => apiRequest('/laborers', { method: 'POST', body: JSON.stringify(data) }),
  labor: () => apiRequest('/labor'),
  createLabor: (data) => apiRequest('/labor', { method: 'POST', body: JSON.stringify(data) }),
  purchases: () => apiRequest('/purchases'),
  createPurchase: (data) => apiRequest('/purchases', { method: 'POST', body: JSON.stringify(data) }),
  production: () => apiRequest('/production'),
  createProduction: (data) => apiRequest('/production', { method: 'POST', body: JSON.stringify(data) }),
  customers: () => apiRequest('/customers'),
  suppliers: () => apiRequest('/suppliers'),
  createSupplier: (data) => apiRequest('/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  createCustomer: (data) => apiRequest('/customers', { method: 'POST', body: JSON.stringify(data) }),
  sales: () => apiRequest('/sales'),
  createSale: (data) => apiRequest('/sales', { method: 'POST', body: JSON.stringify(data) }),
  payments: () => apiRequest('/payments'),
  createPayment: (data) => apiRequest('/payments', { method: 'POST', body: JSON.stringify(data) }),
  deliveries: {
    list: (filters = {}) => apiRequest(`/deliveries?${new URLSearchParams(filters).toString()}`),
    get: (id) => apiRequest(`/deliveries/${id}`),
    create: (data) => apiRequest('/deliveries', { method: 'POST', body: JSON.stringify(data) }),
    updateStatus: (id, status) => apiRequest(`/deliveries/${id}`, { method: 'PUT', body: JSON.stringify({ status }) })
  },
  expenses: {
    list: (filters = {}) => apiRequest(`/expenses?${new URLSearchParams(filters).toString()}`),
    get: (id) => apiRequest(`/expenses/${id}`),
    create: (data) => apiRequest('/expenses', { method: 'POST', body: JSON.stringify(data) }),
    recordGasoline: (data) => apiRequest('/expenses/gasoline', { method: 'POST', body: JSON.stringify(data) }),
    listGasoline: (filters = {}) => apiRequest(`/expenses/gasoline/list?${new URLSearchParams(filters).toString()}`)
  },
  reports: {
    dashboard: () => apiRequest('/reports/dashboard'),
    daily: (date) => apiRequest(`/reports/daily?date=${date}`),
    monthly: (month, year) => apiRequest(`/reports/monthly?month=${month}&year=${year}`),
    yearly: (year) => apiRequest(`/reports/yearly?year=${year}`),
    inventory: (filters = {}) => apiRequest(`/reports/inventory?${new URLSearchParams(filters).toString()}`),
    production: (filters = {}) => apiRequest(`/reports/production?${new URLSearchParams(filters).toString()}`)
  },
  history: (filters = {}) => apiRequest(`/history?${new URLSearchParams(filters).toString()}`),
  employeeAdvances: () => apiRequest('/employee-advances'),
  addEmployeeAdvance: (data) => apiRequest('/employee-advances', { method: 'POST', body: JSON.stringify(data) }),
  payEmployeeAdvance: (id, data) => apiRequest(`/employee-advances/${id}/payments`, { method: 'POST', body: JSON.stringify(data) })
};
