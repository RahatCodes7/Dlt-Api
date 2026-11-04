export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: "user" | "admin";
  status: "active" | "suspended" | "inactive";
  createdAt: string;
  planId?: string;
}

export interface Plan {
  id: string;
  name: string;
  monthlyRequests: number;
  price: number;
  currency: string;
  active: boolean;
  features: string[];
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  platforms: string[];
  status: "active" | "revoked" | "expired";
  lastUsed?: string;
  createdAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  plan: Plan;
  status: "active" | "cancelled" | "expired" | "pending";
  start: string;
  end?: string;
  autoRenew: boolean;
}

export interface UsageStat {
  date: string;
  requests: number;
  success: number;
  failed: number;
}

export interface PlatformUsage {
  platform: string;
  requests: number;
  percentage: number;
}

export interface ApiLog {
  id: string;
  userId: string;
  platform: string;
  endpoint: string;
  url: string;
  status: number;
  responseTime: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  method: string;
  status: "pending" | "completed" | "failed";
  ref: string;
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalRequests: number;
  todayRequests: number;
  totalRevenue: number;
  monthlyRevenue: number;
  activeSubscriptions: number;
  failedRequests: number;
}
