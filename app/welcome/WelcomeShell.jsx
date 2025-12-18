"use client";

import DyanaNavbar from "../../components/DyanaNavbar";
import DyanaFooter from "../../components/DyanaFooter";
import WelcomeClient from "./WelcomeClient";
import { clearToken } from "../../lib/authClient";

export default function WelcomeShell() {
  function handleLogout() {
    try {
      clearToken();
    } catch {}
    // qui non serve altro: la pagina è solo “welcome”
  }

  return (
    <main className="page-root">
      <DyanaNavbar userRole={"guest"} credits={0} onLogout={handleLogout} />

      <section className="landing-wrapper">
        <section className="section" style={{ maxWidth: 720, margin: "0 auto" }}>
          <WelcomeClient />
        </section>
      </section>

      <DyanaFooter />
    </main>
  );
}
