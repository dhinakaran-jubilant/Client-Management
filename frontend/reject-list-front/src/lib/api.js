// src/lib/api.js

// Function to get the correct API base URL based on current access method
function getApiBase() {
  // Localhost access - use environment variable or default
  return import.meta.env.VITE_API_BASE?.replace(/\/$/, '');
}

// Export the base URL for use elsewhere if needed
export const API_BASE = getApiBase();

// Enhanced apiGet function with credentials for Django sessions
export async function apiGet(path, params = {}, options = {}) {
  const url = new URL(`${API_BASE}${path}`);
  
  // Handle query parameters
  Object.entries(params).forEach(([k, v]) => {
    if (v == null || v === '' || (Array.isArray(v) && !v.length)) return;
    url.searchParams.set(k, Array.isArray(v) ? v.join(',') : v);
  });
  
  const fetchOptions = {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    credentials: import.meta.env.VITE_USE_CREDENTIALS === 'true' ? 'include' : 'same-origin',
    ...options
  };
  
  const res = await fetch(url.toString(), fetchOptions);
  
  if (!res.ok) {
    const error = new Error(`HTTP ${res.status}: ${res.statusText}`);
    error.status = res.status;
    try {
      error.data = await res.json();
    } catch {
      error.data = await res.text();
    }
    throw error;
  }
  
  return res.json();
}

// Additional API methods for full CRUD
export async function apiPost(path, data = {}, options = {}) {
  const url = `${API_BASE}${path}`;
  
  const fetchOptions = {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-CSRFToken': getCsrfToken(), // For Django CSRF protection
    },
    credentials: import.meta.env.VITE_USE_CREDENTIALS === 'true' ? 'include' : 'same-origin',
    body: JSON.stringify(data),
    ...options
  };
  
  const res = await fetch(url, fetchOptions);
  
  if (!res.ok) {
    const error = new Error(`HTTP ${res.status}: ${res.statusText}`);
    error.status = res.status;
    try {
      error.data = await res.json();
    } catch {
      error.data = await res.text();
    }
    throw error;
  }
  
  return res.json();
}

export async function apiPut(path, data = {}, options = {}) {
  const url = `${API_BASE}${path}`;
  
  const fetchOptions = {
    method: 'PUT',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-CSRFToken': getCsrfToken(),
    },
    credentials: import.meta.env.VITE_USE_CREDENTIALS === 'true' ? 'include' : 'same-origin',
    body: JSON.stringify(data),
    ...options
  };
  
  const res = await fetch(url, fetchOptions);
  
  if (!res.ok) {
    const error = new Error(`HTTP ${res.status}: ${res.statusText}`);
    error.status = res.status;
    try {
      error.data = await res.json();
    } catch {
      error.data = await res.text();
    }
    throw error;
  }
  
  return res.json();
}

export async function apiDelete(path, options = {}) {
  const url = `${API_BASE}${path}`;
  
  const fetchOptions = {
    method: 'DELETE',
    headers: {
      'Accept': 'application/json',
      'X-CSRFToken': getCsrfToken(),
    },
    credentials: import.meta.env.VITE_USE_CREDENTIALS === 'true' ? 'include' : 'same-origin',
    ...options
  };
  
  const res = await fetch(url, fetchOptions);
  
  if (!res.ok) {
    const error = new Error(`HTTP ${res.status}: ${res.statusText}`);
    error.status = res.status;
    try {
      error.data = await res.json();
    } catch {
      error.data = await res.text();
    }
    throw error;
  }
  
  // DELETE might not return JSON
  if (res.status === 204) {
    return null;
  }
  
  return res.json();
}

// Helper function to get CSRF token from cookies (for Django)
function getCsrfToken() {
  const name = 'csrftoken';
  let cookieValue = null;
  
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  
  return cookieValue;
}

// Utility function to test API connection
export async function testApiConnection() {
  try {
    const response = await apiGet('/');
    console.log('API Connection successful:', response);
    return { success: true, data: response };
  } catch (error) {
    console.error('API Connection failed:', error);
    return { success: false, error: error.message };
  }
}