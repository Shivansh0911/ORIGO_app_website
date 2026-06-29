import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { Storage } from '../utils/storage';

const BASE_URL = process.env['EXPO_PUBLIC_API_URL'] ?? 'http://localhost:3001';

export const apiClient: AxiosInstance = axios.create({
  baseURL: `${BASE_URL}/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = Storage.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = Storage.getRefreshToken();
      const userId = Storage.getUserId();
      const deviceId = Storage.getDeviceId();
      if (refreshToken && userId) {
        try {
          const res = await axios.post(`${BASE_URL}/v1/auth/refresh`, { refreshToken, userId, deviceId });
          Storage.setAccessToken(res.data.accessToken);
          Storage.setRefreshToken(res.data.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
          return apiClient(originalRequest);
        } catch {
          Storage.clearAll();
        }
      }
    }
    return Promise.reject(error as Error);
  }
);
