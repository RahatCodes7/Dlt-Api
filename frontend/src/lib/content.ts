import type { ComponentType } from "react";
import {
  YoutubeIcon,
  InstagramIcon,
  FacebookIcon,
  TiktokIcon,
} from "@/components/brand-icons";

export interface Platform {
  name: string;
  slug: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  accent: string;
  chip: string;
  endpoints: { method: string; path: string; description: string }[];
}

export const platforms: Platform[] = [
  {
    name: "YouTube",
    slug: "youtube",
    description: "Video metadata, format selection, and high-quality downloads.",
    icon: YoutubeIcon,
    accent: "text-red-500",
    chip: "bg-red-500/10 text-red-600 dark:text-red-400",
    endpoints: [
      {
        method: "POST",
        path: "/v1/dlt/youtube/info",
        description: "Get title, duration, thumbnails, and available formats.",
      },
      {
        method: "POST",
        path: "/v1/dlt/youtube/download",
        description: "Download video or audio in the best available quality.",
      },
    ],
  },
  {
    name: "Instagram",
    slug: "instagram",
    description: "Posts, reels, and stories — with and without watermarks.",
    icon: InstagramIcon,
    accent: "text-pink-500",
    chip: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
    endpoints: [
      {
        method: "POST",
        path: "/v1/dlt/instagram/info",
        description: "Resolve media info, dimensions, and author details.",
      },
      {
        method: "POST",
        path: "/v1/dlt/instagram/download",
        description: "Download reels, posts, and stories without a watermark.",
      },
    ],
  },
  {
    name: "Facebook",
    slug: "facebook",
    description: "Videos and reels in MP4, ready for your application.",
    icon: FacebookIcon,
    accent: "text-blue-500",
    chip: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    endpoints: [
      {
        method: "POST",
        path: "/v1/dlt/facebook/info",
        description: "Fetch video or reel metadata in a normalized schema.",
      },
      {
        method: "POST",
        path: "/v1/dlt/facebook/download",
        description: "Download Facebook media in MP4 format.",
      },
    ],
  },
  {
    name: "TikTok",
    slug: "tiktok",
    description: "No-watermark downloads with author and audio metadata.",
    icon: TiktokIcon,
    accent: "text-foreground",
    chip: "bg-foreground/5 text-foreground",
    endpoints: [
      {
        method: "POST",
        path: "/v1/dlt/tiktok/info",
        description: "Get video metadata, author info, and music details.",
      },
      {
        method: "POST",
        path: "/v1/dlt/tiktok/download",
        description: "Download TikTok videos without the watermark.",
      },
    ],
  },
];

export interface Plan {
  name: string;
  price: number | null;
  description: string;
  requests: string;
  features: string[];
  featured?: boolean;
  cta: string;
  href: string;
}

export const plans: Plan[] = [
  {
    name: "Free",
    price: 0,
    description: "Kick the tires and ship your first integration.",
    requests: "100 requests / month",
    features: [
      "All 4 platforms",
      "Info + download endpoints",
      "Standard rate limits",
      "Community support",
    ],
    cta: "Start for free",
    href: "/register",
  },
  {
    name: "Starter",
    price: 9,
    description: "For indie developers and small production apps.",
    requests: "5,000 requests / month",
    features: [
      "All 4 platforms",
      "Priority rate limits",
      "Usage analytics",
      "Email support",
    ],
    featured: true,
    cta: "Start with Starter",
    href: "/register",
  },
  {
    name: "Pro",
    price: 29,
    description: "For growing teams with steady traffic.",
    requests: "25,000 requests / month",
    features: [
      "All 4 platforms",
      "Proxy rotation",
      "Priority support",
      "Higher concurrency",
    ],
    cta: "Start with Pro",
    href: "/register",
  },
  {
    name: "Enterprise",
    price: null,
    description: "Custom volume, dedicated infrastructure, and SLAs.",
    requests: "Unlimited requests",
    features: [
      "Unlimited volume",
      "Dedicated proxies",
      "Custom platforms",
      "99.9% uptime SLA",
    ],
    cta: "Talk to sales",
    href: "/contact",
  },
];

export const faqs = [
  {
    question: "How do I get started with DELETE API?",
    answer:
      "Create a free account, generate an API key from the dashboard, and send your first request. The free tier includes 100 requests per month across every supported platform — no credit card required.",
  },
  {
    question: "Which platforms are supported?",
    answer:
      "YouTube, Instagram, Facebook, and TikTok are available today. Every platform shares the same request shape and response schema, so adding a new source to your app is a config change, not a rewrite.",
  },
  {
    question: "How is pricing calculated?",
    answer:
      "Plans are priced by monthly request volume. Every request to an info or download endpoint counts once. Overages are never billed silently — you can set a hard quota and receive alerts before you hit it.",
  },
  {
    question: "Do you offer a free tier?",
    answer:
      "Yes. The Free plan gives you 100 requests per month on all four platforms, rate-limited but fully functional. It is designed for evaluation and side projects.",
  },
  {
    question: "How secure is my API key?",
    answer:
      "Keys are stored hashed, transmitted only over TLS, and can be scoped per platform. You can rotate or revoke a key instantly from the dashboard, and every request is logged for audit.",
  },
  {
    question: "What happens when a platform changes its internal API?",
    answer:
      "We maintain the yt-dlp extraction layer and ship fixes independently of your integration. Your request and response contract stays stable while we absorb upstream changes.",
  },
];

export const stats = [
  { label: "Platforms supported", value: "4+", sub: "YouTube · IG · FB · TikTok" },
  { label: "Requests served", value: "1M+", sub: "per day at peak" },
  { label: "Uptime", value: "99.9%", sub: "rolling 90-day average" },
  { label: "Median latency", value: "<200ms", sub: "info endpoint p50" },
];
