"use client";

import { Suspense } from "react";
import { useI18n } from "../../../lib/i18n/useI18n";
import CallbackClient from "./CallbackClient";
import CallbackShell from "./CallbackShell";

export default function AuthCallbackPage() {
  const { t } = useI18n();

  return (
    <CallbackShell>
      <Suspense
        fallback={
          <div className="card">
            <h1 className="card-title">
              {t("auth.callback.loadingTitle")}
            </h1>
            <p className="card-text" style={{ opacity: 0.85 }}>
              {t("auth.callback.loadingSubtitle")}
            </p>
          </div>
        }
      >
        <CallbackClient />
      </Suspense>
    </CallbackShell>
  );
}