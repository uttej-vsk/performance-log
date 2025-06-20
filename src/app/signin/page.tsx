"use client";

import { useState, useEffect } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/dashboard",
      });

      setLoading(false);
      if (res?.error) {
        setError("Invalid email or password.");
      } else if (res?.ok) {
        // Double-check session was created
        const session = await getSession();
        if (session?.user) {
          router.push("/dashboard");
        } else {
          setError("Authentication failed. Please try again.");
        }
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } catch (error) {
      setLoading(false);
      setError("An error occurred during sign in. Please try again.");
    }
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="bg-card border border-border p-8 rounded-lg shadow-lg w-full max-w-sm">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded mb-4"></div>
            <div className="h-16 bg-muted rounded mb-4"></div>
            <div className="h-10 bg-muted rounded mb-2"></div>
            <div className="h-10 bg-muted rounded mb-2"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <form
        onSubmit={handleSubmit}
        className="bg-card border border-border p-8 rounded-lg shadow-lg w-full max-w-sm space-y-4"
      >
        <h1 className="text-2xl font-bold mb-2 text-foreground">Sign In</h1>
        <div className="text-xs text-muted-foreground mb-4 p-2 bg-muted rounded">
          Test credentials:
          <br />
          Email: test@example.com
          <br />
          Password: password123
        </div>
        {error && <div className="text-destructive text-sm">{error}</div>}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium mb-1 text-foreground"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-input bg-background text-foreground rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
            autoComplete="email"
            suppressHydrationWarning
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium mb-1 text-foreground"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border border-input bg-background text-foreground rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
            autoComplete="current-password"
            suppressHydrationWarning
          />
        </div>
        <button
          type="submit"
          className="w-full bg-primary text-primary-foreground py-2 rounded font-semibold hover:bg-primary/90 transition disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}
