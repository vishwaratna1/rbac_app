import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({ baseURL: API_URL });

let tokenGetter = null;

export function setTokenGetter(fn) {
  tokenGetter = fn;
}

api.interceptors.request.use((config) => {
  const token = tokenGetter ? tokenGetter() : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
