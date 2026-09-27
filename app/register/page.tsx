"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Registration failed");
        return;
      }

      router.push("/login");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "#f5f7fb",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: 420,
          background: "white",
          padding: 32,
          borderRadius: 16,
          boxShadow: "0 10px 30px rgba(0,0,0,.06)",
        }}
      >
        <h1>Create Account</h1>

        <p style={{ color: "#64748b" }}>
          Start managing your finances.
        </p>

        {error && (
          <p style={{ color: "red" }}>
            {error}
          </p>
        )}

        <label>Name</label>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{
            width: "100%",
            padding: 12,
            margin: "8px 0 18px",
          }}
        />

        <label>Email</label>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            width: "100%",
            padding: 12,
            margin: "8px 0 18px",
          }}
        />

        <label>Password</label>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          style={{
            width: "100%",
            padding: 12,
            margin: "8px 0 18px",
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: 12,
            background: "#172033",
            color: "white",
            border: 0,
            borderRadius: 10,
            cursor: "pointer",
          }}
        >
          {loading ? "Creating..." : "Create Account"}
        </button>

        <p style={{ marginTop: 20 }}>
          Already have an account?{" "}
          <Link href="/login">
            Login
          </Link>
        </p>
      </form>
    </main>
  );
}