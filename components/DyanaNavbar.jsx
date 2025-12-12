"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  getToken,
  getGuestToken,
  getAnyAuthToken,        // <-- USA SYNC
  getAnyAuthTokenAsync,   // <-- solo per primo load
  fetchCreditsState,
  clearToken,
  clearGuestToken,
} from "../lib/authClient";

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

  // --- anti race
  const refreshInFlightRef = useRef(false);

  // --- per log e per evitare stale overwrite
  const creditsRef = useRef(credits);
  useEffect(() => {
    creditsRef.current = credits;
  }, [credits]);

  // --- se un evento aggiorna crediti, blocco per un po’ l’overwrite da /credits/state
  const freezeUntilRef = useRef(0);
  const FREEZE_MS = 2500; // 2.5s: basta per evitare overwrite con stato backend “in ritardo”

  // ======================================================
  // Sync props -> state (se passi valori dalla pagina)
  // ======================================================
  useEffect(() => {
    if (typeof userRoleProp === "string") setUserRole(userRoleProp);
  }, [userRoleProp]);

  useEffect(() => {
    if (typeof creditsProp === "number") setCredits(creditsProp);
  }, [creditsProp]);

  // ======================================================
  // Normalizza crediti da /credits/state in modo robusto
  // ======================================================
  function pickCreditsToShow(cs, backendRole) {
    if (typeof cs?.remaining_credits === "number") return cs.remaining_credits;

    if (backendRole === "guest") {
      if (typeof cs?.free_left === "number") return cs.free_left;
      if (typeof cs?.guest_free_left === "number") return cs.guest_free_left;
      if (typeof cs?.credits === "number") return cs.credits;
      return 0;
    }

    if (typeof cs?.total_available === "number") return cs.total_available;
    if (typeof cs?.paid === "number") return cs.paid;
    if (typeof cs?.credits === "number") return cs.credits;

    return 0;
  }

  // ======================================================
  // Source of truth: /credits/state
  // Nota: NON deve sovrascrivere subito dopo un evento billing
  // ======================================================
  const loadNavbarState = useCallback(async (reason = "manual") => {
    try {
      const now = Date.now();

      // se siamo nella finestra di freeze, NON aggiornare i crediti dal backend
      const freezeActive = now < freezeUntilRef.current;

      // 1) token: primo load può creare guest se serve, ma durante refresh usiamo sync
      const anyToken =
        reason === "initial"
          ? await getAnyAuthTokenAsync()
          : getAnyAuthToken(); // sync: non creare nuovi guest in refresh

      if (!anyToken) {
        setUserRole("guest");
        setCredits(0);
        setEmail(null);
        return;
      }

      const cs = await fetchCreditsState(anyToken);

      const loginToken = getToken();
      const backendRole = cs?.role || (loginToken ? "free" : "guest");
      const normalizedRole = backendRole === "user" ? "free" : backendRole;

      const computedCredits = pickCreditsToShow(cs, backendRole);

      console.log(
        "[NAVBAR] loadNavbarState JSON:",
        JSON.stringify(
          {
            reason,
            freezeActive,
            backendRole,
            normalizedRole,
            computedCredits,
            credits_before: creditsRef.current,
            cs_remaining_credits: cs?.remaining_credits,
            cs_free_left: cs?.free_left,
            cs_total_available: cs?.total_available,
            cs_paid: cs?.paid,
            cs_credits: cs?.credits,
            cs_role: cs?.role,
            cs_email: cs?.email,
          },
          null,
          2
        )
      );

      setUserRole(normalizedRole);
      setEmail(cs?.email || null);

      // QUI la differenza: se freeze è attivo, NON sovrascrivere credits
      if (!freezeActive) {
        setCredits(computedCredits);
      } else {
        console.log(
          "[NAVBAR] skip credits overwrite (freeze active). credits stays:",
          creditsRef.current
        );
      }
    } catch (err) {
      console.error("[NAVBAR] errore caricamento stato utente:", err);
      setUserRole("guest");
      setCredits(0);
      setEmail(null);
    }
  }, []);

  // Primo load
  useEffect(() => {
    loadNavbarState("initial");
  }, [loadNavbarState]);

  // ======================================================
  // Refresh crediti via eventi globali (con log + freeze)
  // ======================================================
  useEffect(() => {
    function handleRefresh(e) {
      const userTok = getToken() || "";
      const guestTok = getGuestToken() || "";

      console.log(
        "[NAVBAR] evento refresh JSON:",
        JSON.stringify(
          {
            type: e?.type,
            detail: e?.detail,
            credits_before: creditsRef.current,
            token_user: userTok ? userTok.slice(0, 20) + "…" : null,
            token_guest: guestTok ? guestTok.slice(0, 20) + "…" : null,
          },
          null,
          2
        )
      );

      const remaining =
        e?.detail && typeof e.detail.remaining_credits === "number"
          ? e.detail.remaining_credits
          : null;

      // 1) update immediato da billing
      if (remaining !== null) {
        freezeUntilRef.current = Date.now() + FREEZE_MS; // blocca overwrite backend per un po'
        setCredits(remaining);
      }

      // 2) riallineamento: lo facciamo SOLO per ruolo/email e per crediti DOPO freeze
      if (refreshInFlightRef.current) return;
      refreshInFlightRef.current = true;

      // se c'è remaining, aspetta fine freeze prima di rileggerli
      const delay = remaining !== null ? FREEZE_MS : 0;

      setTimeout(() => {
        Promise.resolve(loadNavbarState("event")).finally(() => {
          refreshInFlightRef.current = false;
        });
      }, delay);
    }

    if (typeof window === "undefined") return;

    window.addEventListener("dyana:refresh-credits", handleRefresh);
    window.addEventListener("dyana-credits-updated", handleRefresh);

    const onVis = () => {
      if (document.visibilityState === "visible") {
        handleRefresh({ type: "visibilitychange", detail: {} });
      }
    };
    document.addEventListener("visibilitychange", onVis);

    const onStorage = (ev) => {
      if (ev.key === "dyana_jwt" || ev.key === "diyana_guest_jwt") {
        handleRefresh({ type: "storage", detail: {} });
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("dyana:refresh-credits", handleRefresh);
      window.removeEventListener("dyana-credits-updated", handleRefresh);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("storage", onStorage);
    };
  }, [loadNavbarState]);

  // ======================================================
  // Logout
  // ======================================================
  function handleLogoutClick() {
    if (logoutInProgress) return;
    setLogoutInProgress(true);

    setUserRole("guest");
    setCredits(0);
    setEmail(null);
    setIsMenuOpen(false);

    if (onLogout) {
      onLogout();
      return;
    }

    clearToken();
    clearGuestToken?.();

    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  }

  function handleAreaPersonaleClick(e) {
    e.preventDefault();
    if (typeof window === "undefined") return;

    if (isGuest) window.location.href = "/login";
    else window.location.href = "/area-personale";
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

          <div className="dyana-navbar-menu-wrapper">
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
              className={`dyana-navbar-links ${isMenuOpen ? "open" : ""}`}
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
