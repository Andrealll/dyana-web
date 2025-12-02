"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { NAV_ITEMS } from "../app/config/navItems";
import {
  getToken,
  fetchCreditsState,
  clearToken,
} from "../lib/authClient";

export default function DyanaNavbar({
  userRole: userRoleProp,
  credits: creditsProp,
  onLogout,
}) {
  const [userRole, setUserRole] = useState(userRoleProp ?? "guest");
  const [credits, setCredits] = useState(creditsProp ?? 0);
  const [email, setEmail] = useState(null);

  // Carica ruolo + crediti + email reali da /credits/state
  useEffect(() => {
    async function loadNavbarState() {
      try {
        const token = getToken();
        if (!token) {
          setUserRole("guest");
          setCredits(0);
          setEmail(null);
          return;
        }

        const cs = await fetchCreditsState(token);

        const role = cs.paid > 0 ? "user" : "free";

        setUserRole(role);
        setCredits(cs.total_available ?? 0);
        setEmail(cs.email || null);
      } catch (err) {
        console.error("[NAVBAR] errore caricamento stato utente:", err);
        setUserRole("guest");
        setCredits(0);
        setEmail(null);
      }
    }

    loadNavbarState();
  }, []);

  const isGuest = userRole === "guest";

  function handleLogoutClick() {
    if (onLogout) {
      onLogout();
      return;
    }
    // fallback di default: pulisco token e porto al login
    clearToken();
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  }

  // Testo riga superiore a sinistra
  const topLineText = isGuest
    ? "Navigazione come ospite"
    : email || "Utente registrato";

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

        {/* Menu principale guidato da NAV_ITEMS */}
        <nav
          style={{
            display: "flex",
            gap: 22,
            fontSize: "0.9rem",
            flexWrap: "wrap",
          }}
        >
          {NAV_ITEMS.map((item) => {
            const isLogin = item.href === "/login";
            return (
              <Link
                key={item.href}
                href={item.href}
                className="nav-link"
                style={{
                  textDecoration: "none",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  fontSize: "0.8rem",
                  color: isLogin ? "var(--dyana-gold)" : "#f5f5ff",
                  opacity: isLogin ? 0.95 : 0.9,
                }}
              >
                {item.label}
              </Link>
            );
          })}
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
          <span style={{ opacity: 0.9 }}>{topLineText}</span>
          <span style={{ opacity: 0.8 }}>
            Crediti disponibili:{" "}
            <strong style={{ color: "var(--dyana-gold)" }}>{credits}</strong>
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {!isGuest && (
            <button
              type="button"
              onClick={handleLogoutClick}
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
