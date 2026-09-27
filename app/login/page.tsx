"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError("");
    setGoogleLoading(true);

    try {
      await signIn("google", {
        callbackUrl: "/dashboard",
      });
    } catch {
      setError("Unable to sign in with Google");
      setGoogleLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "var(--finance-bg, #f5f7fb)",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: 420,
          background: "var(--finance-surface, white)",
          color: "var(--finance-text, #172033)",
          padding: 32,
          borderRadius: 16,
          boxShadow:
            "0 10px 30px rgba(15, 23, 42, 0.08)",
        }}
      >
        <h1
          style={{
            margin: "0 0 8px",
            fontSize: 30,
          }}
        >
          Welcome Back
        </h1>

        <p
          style={{
            color: "var(--finance-text-muted, #64748b)",
            marginBottom: 24,
          }}
        >
          Login to your finance tracker.
        </p>

        {error && (
          <div
            style={{
              padding: 12,
              marginBottom: 18,
              borderRadius: 10,
              background:
                "var(--finance-danger-light, #fef2f2)",
              color:
                "var(--finance-danger, #dc2626)",
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        <label
          htmlFor="email"
          style={{
            display: "block",
            marginBottom: 6,
            fontWeight: 600,
          }}
        >
          Email
        </label>

        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: 12,
            marginBottom: 18,
            border: "1px solid var(--finance-border, #e5e7eb)",
            borderRadius: 10,
            background:
              "var(--finance-surface-secondary, #f8fafc)",
            color: "var(--finance-text, #172033)",
            outline: "none",
          }}
        />

        <label
          htmlFor="password"
          style={{
            display: "block",
            marginBottom: 6,
            fontWeight: 600,
          }}
        >
          Password
        </label>

        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: 12,
            marginBottom: 18,
            border: "1px solid var(--finance-border, #e5e7eb)",
            borderRadius: 10,
            background:
              "var(--finance-surface-secondary, #f8fafc)",
            color: "var(--finance-text, #172033)",
            outline: "none",
          }}
        />

        <button
          type="submit"
          disabled={loading || googleLoading}
          style={{
            width: "100%",
            padding: 12,
            background: "#172033",
            color: "white",
            border: 0,
            borderRadius: 10,
            cursor:
              loading || googleLoading
                ? "not-allowed"
                : "pointer",
            opacity:
              loading || googleLoading ? 0.7 : 1,
            fontSize: 15,
            fontWeight: 600,
          }}
        >
          {loading ? "Signing in..." : "Login"}
        </button>

        {/* DIVIDER */}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            margin: "24px 0",
            color:
              "var(--finance-text-muted, #64748b)",
            fontSize: 13,
          }}
        >
          <div
            style={{
              flex: 1,
              height: 1,
              background:
                "var(--finance-border, #e5e7eb)",
            }}
          />

          <span>OR</span>

          <div
            style={{
              flex: 1,
              height: 1,
              background:
                "var(--finance-border, #e5e7eb)",
            }}
          />
        </div>

        {/* GOOGLE LOGIN */}

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading || googleLoading}
          style={{
            width: "100%",
            padding: 12,
            background:
              "var(--finance-surface, white)",
            color:
              "var(--finance-text, #172033)",
            border:
              "1px solid var(--finance-border, #e5e7eb)",
            borderRadius: 10,
            cursor:
              loading || googleLoading
                ? "not-allowed"
                : "pointer",
            opacity:
              loading || googleLoading ? 0.7 : 1,
            fontSize: 15,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}
        >
          <span
            style={{
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            G
          </span>

          {googleLoading
            ? "Connecting to Google..."
            : "Continue with Google"}
        </button>

        <p
          style={{
            marginTop: 20,
            color:
              "var(--finance-text-secondary, #475569)",
          }}
        >
          Don't have an account?{" "}
          <Link
            href="/register"
            style={{
              color:
                "var(--finance-primary, #4f46e5)",
              fontWeight: 600,
            }}
          >
            Create one
          </Link>
        </p>
      </form>
    </main>
  );
}