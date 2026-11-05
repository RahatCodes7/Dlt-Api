"use client";

import * as React from "react";
import {
  CheckCircle2,
  Clock,
  Mail,
  MessageSquare,
  Send,
  Building2,
} from "lucide-react";
import { Input } from "@/components/ui/input";

const topics = ["General inquiry", "Technical support", "Billing", "Enterprise"];

export default function ContactPage() {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [topic, setTopic] = React.useState(topics[0]);
  const [message, setMessage] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState("");

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("Please fill in your name, email, and message.");
      return;
    }
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 700));
    setLoading(false);
    setSent(true);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary">
            <MessageSquare className="h-3.5 w-3.5" /> Contact
          </span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
            Talk to the team
          </h1>
          <p className="mt-4 max-w-md text-muted-foreground">
            Bug reports, integration questions, or a custom enterprise plan — send it
            over and we will reply within one business day.
          </p>

          <div className="mt-8 space-y-3">
            {[
              { icon: Mail, title: "Email", value: "support@deleteapi.com" },
              { icon: Clock, title: "Support hours", value: "Mon–Fri · 09:00–18:00 UTC" },
              { icon: Building2, title: "Enterprise", value: "sales@deleteapi.com" },
            ].map((item) => (
              <div key={item.title} className="surface flex items-center gap-3 p-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <item.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {item.title}
                  </p>
                  <p className="text-sm font-medium">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            Including the <code className="font-mono text-xs">request_id</code> from a
            failed call helps us trace the exact request.
          </div>
        </div>

        <div className="surface p-6 sm:p-8">
          {sent ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
                <CheckCircle2 className="h-7 w-7" />
              </span>
              <h2 className="mt-4 text-xl font-bold">Message sent</h2>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Thanks, {name.split(" ")[0] || "there"}. We received your note and will
                reply to {email || "your inbox"} shortly.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSent(false);
                  setMessage("");
                }}
                className="btn btn-outline mt-6"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <h2 className="text-lg font-semibold">Send us a message</h2>
              {error && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="name" className="text-sm font-medium">
                    Full name
                  </label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Ada Lovelace"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@company.com"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="topic" className="text-sm font-medium">
                  Topic
                </label>
                <select
                  id="topic"
                  value={topic}
                  onChange={(event) => setTopic(event.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {topics.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="message" className="text-sm font-medium">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={6}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Tell us what you are building and what you need…"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary w-full py-3 disabled:opacity-60">
                {loading ? "Sending…" : "Send message"}
                {!loading && <Send className="h-4 w-4" />}
              </button>
              <p className="text-center text-xs text-muted-foreground">
                We never share your email. Read our privacy note in the docs.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
