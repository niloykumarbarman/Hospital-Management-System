"use client";

import { useState, FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import GlassCard from "@/components/ui/GlassCard";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login({ email, password });
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        setError("Invalid credentials");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--background)] overflow-hidden relative">
      <div
        className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[var(--accent)]/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-[var(--accent-secondary)]/10 blur-3xl"
        aria-hidden="true"
      />

      <GlassCard className="w-full max-w-sm relative animate-fade-in-up">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold animated-gradient-text tracking-tight">
            HMS Login
          </h1>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            Sign in to access the Hospital Management System
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div
            className="animate-fade-in-up"
            style={{ animationDelay: "80ms" }}
          >
            <Input
              id="email"
              type="email"
              label="Email"
              placeholder="you@hms.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div
            className="animate-fade-in-up"
            style={{ animationDelay: "140ms" }}
          >
            <Input
              id="password"
              type="password"
              label="Password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p
              className="text-sm text-[var(--danger)] animate-fade-in-up"
              role="alert"
            >
              {error}
            </p>
          )}

          <div
            className="animate-fade-in-up"
            style={{ animationDelay: "200ms" }}
          >
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="mt-2 w-full gap-2"
              disabled={loading}
            >
              {loading && (
                <span
                  className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin-smooth"
                  aria-hidden="true"
                />
              )}
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
