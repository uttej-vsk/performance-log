"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log("Form submitted with:", {
      email,
      password: password ? "[HIDDEN]" : "[EMPTY]",
    });

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log("Calling signIn...");
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/dashboard",
      });

      console.log("SignIn response:", res);

      setLoading(false);
      if (res?.error) {
        console.error("SignIn error:", res.error);
        setError("Invalid email or password.");
      } else if (res?.ok) {
        console.log("SignIn successful, redirecting...");
        router.push("/dashboard");
      } else {
        console.error("Unexpected signIn response:", res);
        setError("An unexpected error occurred. Please try again.");
      }
    } catch (error) {
      console.error("SignIn exception:", error);
      setLoading(false);
      setError("An error occurred during sign in. Please try again.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <form
        onSubmit={handleSubmit}
        className="bg-card border border-border p-8 rounded-lg shadow-lg w-full max-w-sm space-y-4"
      >
        <h1 className="text-2xl font-bold mb-2 text-foreground">Sign In</h1>
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
