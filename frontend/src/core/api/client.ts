import axios from 'axios';
import { useAuthStore } from '../store/authStore';

export interface APIEnvelope<T = any> {
  data: T;
  meta: {
    lineage_id?: string;
    data_quality?: {
      completeness_score: number;
      confidence_score: number;
      validation_status: string;
    };
  };
  errors: string[];
}

const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response && error.response.status === 401) {
      useAuthStore.getState().logout();
    }
    const message = error.response?.data?.detail || error.message || 'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

export default apiClient;
