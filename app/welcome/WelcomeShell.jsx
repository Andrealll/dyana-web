"use client";

import DyanaNavbar from "../../components/DyanaNavbar";
import DyanaFooter from "../../components/DyanaFooter";
import { clearToken } from "../../lib/authClient";

export default function WelcomeShell({ children }) {
  function handleLogout() {
    try {
      clearToken();
    } catch {}
  }

  return (
    <main className="page-root">
      <DyanaNavbar userRole={"guest"} credits={0} onLogout={handleLogout} />

      <section className="landing-wrapper">
        <section className="section" style={{ maxWidth: 720, margin: "0 auto" }}>
          {children}
        </section>
      </section>

      <DyanaFooter />
    </main>
  );
}
