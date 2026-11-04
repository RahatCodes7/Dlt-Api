"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle login
  };

  return (
    <div className="px-4 py-12">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="flex items-center gap-2 mb-4 inline-block">
            <span className="text-primary font-bold text-xl">DLT</span>
            <span className="font-bold text-xl">DELETE API</span>
          </Link>
          <h2 className="text-2xl font-bold">Welcome back</h2>
          <p className="text-muted-foreground">Sign in to your DELETE API account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input label="Password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded border-input" />
              Remember me
            </label>
            <Link href="/forgot-password" className="text-primary">Forgot password?</Link>
          </div>
          <Button type="submit" className="w-full py-3">Sign in</Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link href="/register" className="font-medium text-primary">Create account</Link>
        </p>
      </div>
    </div>
  );
}
