import axios from 'axios';
import { supabase } from './supabaseClient';

const isLocalHost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// Vite replaces this value at build time. Set it in the deployment host
// so production requests go to the separately hosted FastAPI service.
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? (isLocalHost ? 'http://localhost:8000' : '');

export const api = axios.create({
  baseURL: apiBaseUrl,
});

// Attach the real Supabase access token to every outgoing request.
api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On any 401, the token is dead — sign out and let ProtectedRoute redirect.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await supabase.auth.signOut();
    }
    return Promise.reject(error);
  }
);
