import axios, { AxiosInstance } from "axios";

/**
 * Browser requests go to the same origin (`/v1/...`). Next.js rewrites that
 * path to the FastAPI backend (see next.config.ts), so session cookies are
 * first-party and CORS never gets in the way.
 */
export const API_BASE = "";

/**
 * Absolute API URL used in documentation and quick-start snippets.
 */
export const PUBLIC_API_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://dltapi.cc.cd";

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

export type ApiError = {
  detail?: string;
  error?: { code?: string; message?: string };
};

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...init,
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as ApiError;
    const detail = data.error?.message ?? data.detail;
    throw new Error(
      typeof detail === "string"
        ? detail
        : `Request failed (${response.status})`,
    );
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export type { AxiosInstance };
