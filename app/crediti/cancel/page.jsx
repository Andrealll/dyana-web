"use client";

import { useI18n } from "../../../lib/i18n/useI18n";

export default function CreditiCancelPage() {
  const { t } = useI18n();

  return (
    <main className="page-root">
      <section className="landing-wrapper">
        <section className="section" style={{ paddingTop: "64px" }}>
          <div
            className="card"
            style={{
              maxWidth: "640px",
              margin: "0 auto",
              textAlign: "center",
              padding: "32px 24px",
            }}
          >
            <h1 className="section-title" style={{ marginBottom: "12px" }}>
              {t("auth.cancel.title")}
            </h1>

            <p className="section-subtitle" style={{ marginBottom: "24px" }}>
              {t("auth.cancel.subtitle")}
            </p>

            <p className="card-text" style={{ marginBottom: "24px" }}>
              {t("auth.cancel.description")}
            </p>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                alignItems: "center",
              }}
            >
              <a
                href="/crediti"
                className="btn btn-primary"
                style={{ minWidth: "220px" }}
              >
                {t("auth.cancel.ctaCredits")}
              </a>

              <a
                href="/"
                className="btn btn-secondary"
                style={{ minWidth: "220px" }}
              >
                {t("auth.cancel.ctaHome")}
              </a>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}