import { Suspense } from "react";
import DyanaNavbar from "../../../components/DyanaNavbar";
import DyanaFooter from "../../../components/DyanaFooter";
import CallbackClient from "./CallbackClient";

export default function AuthCallbackPage() {
  return (
    <main className="page-root">
      <DyanaNavbar userRole={"guest"} credits={0} onLogout={() => {}} />

      <section className="landing-wrapper">
        <section className="section" style={{ maxWidth: 720, margin: "0 auto" }}>
          <Suspense
            fallback={
              <div className="card">
                <h1 className="card-title">Sto completando l’accesso…</h1>
                <p className="card-text" style={{ opacity: 0.85 }}>Un momento.</p>
              </div>
            }
          >
            <CallbackClient />
          </Suspense>
        </section>
      </section>

      <DyanaFooter />
    </main>
  );
}
