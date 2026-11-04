"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="px-4 py-12">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="flex items-center gap-2 mb-4 inline-block">
            <span className="text-primary font-bold text-xl">DLT</span>
            <span className="font-bold text-xl">DELETE API</span>
          </Link>
          <h2 className="text-2xl font-bold">Forgot password</h2>
          <p className="text-muted-foreground">Enter your email to reset your password</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Button type="submit" className="w-full py-3">Send reset link</Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link href="/login" className="font-medium text-primary">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
