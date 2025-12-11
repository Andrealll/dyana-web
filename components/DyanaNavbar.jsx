"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { getToken, fetchCreditsState, clearToken } from "../lib/authClient";

export default function DyanaNavbar({
  userRole: userRoleProp,
  credits: creditsProp,
  onLogout,
}) {
  const [userRole, setUserRole] = useState(userRoleProp ?? "guest");
  const [credits, setCredits] = useState(creditsProp ?? 0);
  const [email, setEmail] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [logoutInProgress, setLogoutInProgress] = useState(false);

  const isGuest = userRole === "guest";

  // --- CARICAMENTO CREDITS / RUOLO ----------------------------------------
  const loadNavbarState = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) {
        setUserRole("guest");
        setCredits(0);
        setEmail(null);
        return;
      }

      const cs = await fetchCreditsState(token);

      // Ruolo dal backend (preferito), con fallback
      const backendRole = cs.role || null;
      const role =
        backendRole && typeof backendRole === "string"
          ? backendRole
          : cs.paid > 0
          ? "user"
          : "guest";

      const isGuestRole = role === "guest";

      // Calcolo crediti da mostrare in navbar
      let creditsForNavbar = 0;

      if (isGuestRole) {
        // GUEST: mostra i crediti gratuiti rimasti
        if (typeof cs.free_left === "number") {
          creditsForNavbar = cs.free_left;
        } else if (typeof cs.total_available === "number") {
          // fallback se il backend usa già total_available per i guest
          creditsForNavbar = cs.total_available;
        } else {
          creditsForNavbar = 0;
        }
      } else {
        // UTENTE REGISTRATO: mostra il totale disponibile (paid + free)
        if (typeof cs.total_available === "number") {
          creditsForNavbar = cs.total_available;
        } else if (typeof cs.paid === "number") {
          creditsForNavbar = cs.paid;
        } else {
          creditsForNavbar = 0;
        }
      }

      setUserRole(role);
      setCredits(creditsForNavbar);
      setEmail(cs.email || null);
    } catch (err) {
      console.error("[NAVBAR] errore caricamento stato utente:", err);
      setUserRole("guest");
      setCredits(0);
      setEmail(null);
    }
  }, []);

  useEffect(() => {
    loadNavbarState();
  }, [loadNavbarState]);

  // Ricarica crediti quando fai:
  // window.dispatchEvent(new Event("dyana:refresh-credits"))
  useEffect(() => {
    function handleRefresh() {
      loadNavbarState();
    }
    if (typeof window !== "undefined") {
      window.addEventListener("dyana:refresh-credits", handleRefresh);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("dyana:refresh-credits", handleRefresh);
      }
    };
  }, [loadNavbarState]);

  function handleLogoutClick() {
    if (logoutInProgress) return; // evita doppi click
    setLogoutInProgress(true);

    // Aggiorna SUBITO la UI
    setUserRole("guest");
    setCredits(0);
    setEmail(null);

    // Chiudi eventualmente il menu mobile
    setIsMenuOpen(false);

    if (onLogout) {
      onLogout();
      return;
    }

    clearToken();

    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  }

  function handleAreaPersonaleClick(e) {
    e.preventDefault();
    if (typeof window === "undefined") return;

    if (isGuest) {
      window.location.href = "/login";
    } else {
      window.location.href = "/area-personale";
    }
  }

  const topLineText = isGuest
    ? "Navigazione come ospite"
    : email || "Utente registrato";

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/tema", label: "Tema natale" },
    { href: "/compatibilita", label: "Compatibilità" },
    { href: "/oroscopo", label: "Oroscopo" },
  ];

  return (
    <header className="dyana-navbar">
      <div className="dyana-navbar-inner">
        {/* RIGA SUPERIORE: logo + menu / hamburger */}
        <div className="dyana-navbar-top">
          <Link href="/" className="dyana-navbar-logo-link">
            <Image
              src="/dyana-logo-NAV.png"
              alt="DYANA"
              width={32}
              height={32}
              className="dyana-navbar-logo"
            />
            <span className="dyana-navbar-logo-text">DYANA</span>
          </Link>

          {/* Menu desktop + mobile (a tendina) */}
          <div className="dyana-navbar-menu-wrapper">
            {/* Hamburger solo su mobile (gestito da CSS) */}
            <button
              type="button"
              className="dyana-navbar-toggle"
              onClick={() => setIsMenuOpen((v) => !v)}
              aria-label="Apri menu"
              aria-expanded={isMenuOpen}
            >
              ☰
            </button>

            <nav
              className={`dyana-navbar-links ${
                isMenuOpen ? "open" : ""
              }`}
              aria-hidden={!isMenuOpen}
            >
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="dyana-navbar-link"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}

              <a
                href={isGuest ? "/login" : "/area-personale"}
                className="dyana-navbar-link dyana-navbar-link-area"
                onClick={(e) => {
                  handleAreaPersonaleClick(e);
                  setIsMenuOpen(false);
                }}
              >
                Area personale
              </a>

              {!isGuest && (
                <button
                  type="button"
                  className="dyana-navbar-logout"
                  onClick={() => {
                    handleLogoutClick();
                    setIsMenuOpen(false);
                  }}
                  disabled={logoutInProgress}
                >
                  {logoutInProgress ? "Logout..." : "Logout"}
                </button>
              )}
            </nav>
          </div>
        </div>

        {/* RIGA INFERIORE: stato utente + crediti */}
        <div className="dyana-navbar-bottom">
          <div className="dyana-navbar-status">
            <span className="dyana-navbar-status-top">{topLineText}</span>
            <span className="dyana-navbar-status-credits">
              Crediti: <strong>{credits}</strong>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
