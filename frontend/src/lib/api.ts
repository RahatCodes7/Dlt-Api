import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/v1/dlt";

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // Cookies are sent automatically via withCredentials: true
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      if (typeof window !== "undefined") {
        // Token expired or invalid - redirect to login
        window.location.href = "/login?expired=true";
      }
    }
    return Promise.reject(err);
  }
);

export type { AxiosInstance };
