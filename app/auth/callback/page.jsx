// app/auth/callback/page.jsx
import { Suspense } from "react";
import CallbackClient from "./CallbackClient";
import CallbackShell from "./CallbackShell";

export default function AuthCallbackPage() {
  return (
    <CallbackShell>
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
    </CallbackShell>
  );
}
