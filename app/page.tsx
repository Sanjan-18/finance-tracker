import Link from "next/link";

export default function Home() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <section style={{ maxWidth: 720, textAlign: "center" }}>
        <p style={{ fontWeight: 700, letterSpacing: 1 }}>FINANCETRACKER</p>
        <h1 style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)", margin: "12px 0" }}>
          Take control of your money.
        </h1>
        <p style={{ fontSize: 18, color: "#64748b", lineHeight: 1.6 }}>
          A full-stack personal finance tracker built with Next.js, TypeScript,
          Prisma and PostgreSQL.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 28 }}>
          <Link href="/dashboard" style={{ background: "#172033", color: "white", padding: "12px 20px", borderRadius: 10 }}>
            Open Dashboard
          </Link>
          <Link href="/login" style={{ border: "1px solid #cbd5e1", padding: "12px 20px", borderRadius: 10 }}>
            Login
          </Link>
        </div>
      </section>
    </main>
  );
}
