"use client";

import Link from "next/link";

export default function DyanaNavbar({ userRole, credits, onLogout }) {
  const isGuest = userRole === "guest";

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        width: "100%",
        padding: "14px 32px",
        borderBottom: "1px solid rgba(187,154,99,0.35)", // dyana-gold soft
        background:
          "linear-gradient(90deg, rgba(21,25,28,0.98), rgba(44,64,80,0.98))",
        backdropFilter: "blur(10px)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {/* Riga 1: logo + menu */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
        }}
      >
        {/* Logo testuale (il vero logo resta nella home splash) */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            textDecoration: "none",
          }}
        >
          <span
            style={{
              fontSize: "1.3rem",
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--dyana-gold)",
            }}
          >
            DYANA
          </span>
          <span
            style={{
              fontSize: "0.8rem",
              opacity: 0.75,
              color: "#f5f5ff",
            }}
          >
            astrology engine
          </span>
        </Link>

        {/* Menu principale */}
        <nav
          style={{
            display: "flex",
            gap: 22,
            fontSize: "0.9rem",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/tema"
            className="nav-link"
            style={{
              textDecoration: "none",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              fontSize: "0.8rem",
              color: "#f5f5ff",
              opacity: 0.9,
            }}
          >
            Tema Natale
          </Link>
          <Link
            href="/compatibilita"
            className="nav-link"
            style={{
              textDecoration: "none",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              fontSize: "0.8rem",
              color: "#f5f5ff",
              opacity: 0.9,
            }}
          >
            Compatibilità
          </Link>
          <Link
            href="/oroscopo"
            className="nav-link"
            style={{
              textDecoration: "none",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              fontSize: "0.8rem",
              color: "#f5f5ff",
              opacity: 0.9,
            }}
          >
            Oroscopo
          </Link>
          <Link
            href="/login"
            className="nav-link"
            style={{
              textDecoration: "none",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              fontSize: "0.8rem",
              color: "var(--dyana-gold)",
              opacity: 0.95,
            }}
          >
            Accedi / Registrati
          </Link>
        </nav>
      </div>

      {/* Riga 2: stato utente + logout */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          fontSize: "0.8rem",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ opacity: 0.9 }}>
            {isGuest ? "Navigazione come ospite" : `Utente DYANA (${userRole})`}
          </span>
          <span style={{ opacity: 0.8 }}>
            Crediti disponibili:{" "}
            <strong style={{ color: "var(--dyana-gold)" }}>{credits}</strong>
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {!isGuest && onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="btn"
              style={{
                fontSize: "0.8rem",
                padding: "6px 14px",
                borderRadius: "999px",
                border: "1px solid rgba(187,154,99,0.6)",
                background: "transparent",
              }}
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
