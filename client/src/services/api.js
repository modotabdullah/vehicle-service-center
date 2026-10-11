const API_BASE = '/api';

/**
 * Universal fetch wrapper that attaches JWT and handles JSON responses.
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('apex_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.message || `Request failed with status ${response.status}`;
      const err = new Error(errorMsg);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (err) {
    console.error(`API Error on [${options.method || 'GET'} ${endpoint}]:`, err);
    throw err;
  }
}

export const api = {
  // Authentication
  auth: {
    login: (username, password) => request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
    register: (userData) => request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
    getMe: () => request('/auth/me'),
  },

  // Dashboard
  dashboard: {
    getStats: () => request('/dashboard/stats'),
  },

  // Service Jobs
  jobs: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/jobs${query ? `?${query}` : ''}`);
    },
    getActive: () => request('/jobs/active'),
    getById: (id) => request(`/jobs/${id}`),
    create: (jobData) => request('/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    }),
    updateStatus: (id, statusData) => request(`/jobs/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(statusData),
    }),
    addItem: (id, itemData) => request(`/jobs/${id}/items`, {
      method: 'POST',
      body: JSON.stringify(itemData),
    }),
    addPart: (id, partData) => request(`/jobs/${id}/parts`, {
      method: 'POST',
      body: JSON.stringify(partData),
    }),
  },

  // Inventory Parts
  inventory: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/inventory${query ? `?${query}` : ''}`);
    },
    getLowStock: () => request('/inventory/low-stock'),
    create: (partData) => request('/inventory', {
      method: 'POST',
      body: JSON.stringify(partData),
    }),
    update: (id, updateData) => request(`/inventory/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    }),
  },

  // Invoices & Billing
  invoices: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/invoices${query ? `?${query}` : ''}`);
    },
    getById: (id) => request(`/invoices/${id}`),
    generate: (jobId, data = {}) => request(`/invoices/generate/${jobId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    processPayment: (id, paymentData) => request(`/invoices/${id}/payments`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    }),
  },

  // Customers
  customers: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/customers${query ? `?${query}` : ''}`);
    },
    getById: (id) => request(`/customers/${id}`),
    create: (data) => request('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id, data) => request(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  },

  // Vehicles
  vehicles: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/vehicles${query ? `?${query}` : ''}`);
    },
    getById: (id) => request(`/vehicles/${id}`),
    create: (data) => request('/vehicles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },

  // Mechanics
  mechanics: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/mechanics${query ? `?${query}` : ''}`);
    },
    getById: (id) => request(`/mechanics/${id}`),
    create: (data) => request('/mechanics', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id, data) => request(`/mechanics/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  },

  // Audit Logs (System Admin)
  audit: {
    getLogs: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/audit${query ? `?${query}` : ''}`);
    },
  },
};
