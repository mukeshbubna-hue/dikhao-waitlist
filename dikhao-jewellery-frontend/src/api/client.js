import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 60_000,  // fail fast instead of hanging forever if tunnel drops
  headers: {
    // ngrok free tunnels show a browser warning page otherwise; this header bypasses it.
    'ngrok-skip-browser-warning': 'true',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dikhao_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('dikhao_token');
      if (location.pathname !== '/login' && location.pathname !== '/signup') {
        location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
