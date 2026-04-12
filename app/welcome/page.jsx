"use client";

import { Suspense } from "react";
import { useI18n } from "../../lib/i18n/useI18n";
import WelcomeShell from "./WelcomeShell";
import WelcomeClient from "./WelcomeClient";

export default function WelcomePage() {
  const { t } = useI18n();

  return (
    <WelcomeShell>
      <Suspense
        fallback={
          <div className="card">
            <h1 className="card-title">
              {t("auth.welcome.loadingTitle")}
            </h1>
            <p className="card-text" style={{ opacity: 0.85 }}>
              {t("auth.welcome.loadingSubtitle")}
            </p>
          </div>
        }
      >
        <WelcomeClient />
      </Suspense>
    </WelcomeShell>
  );
}