"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
          <h2 className="text-2xl font-bold">Create account</h2>
          <p className="text-muted-foreground">Start building with DELETE API today</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Full Name" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input label="Password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Input label="Confirm Password" type="password" placeholder="••••••••" required />
          <div className="flex items-center gap-2 text-sm">
            <input type="checkbox" id="terms" className="rounded border-input" required />
            <label htmlFor="terms" className="text-muted-foreground">
              I agree to the <Link href="#" className="text-primary">Terms of Service</Link> and <Link href="#" className="text-primary">Privacy Policy</Link>
            </label>
          </div>
          <Button type="submit" className="w-full py-3">Create account</Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
