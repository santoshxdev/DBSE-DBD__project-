import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT auth token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('rfid_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle auth errors globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired or invalid
      if (localStorage.getItem('rfid_token')) {
        localStorage.removeItem('rfid_token');
        localStorage.removeItem('rfid_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default API;
