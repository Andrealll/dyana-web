import { Suspense } from "react";
import WelcomeShell from "./WelcomeShell";
import WelcomeClient from "./WelcomeClient";

export default function WelcomePage() {
  return (
    <WelcomeShell>
      <Suspense
        fallback={
          <div className="card">
            <h1 className="card-title">Sto caricando…</h1>
            <p className="card-text" style={{ opacity: 0.85 }}>Un momento.</p>
          </div>
        }
      >
        <WelcomeClient />
      </Suspense>
    </WelcomeShell>
  );
}
