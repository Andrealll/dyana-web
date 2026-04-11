// app/come-funziona/page.jsx
"use client";

import { useI18n } from "../../lib/i18n/useI18n";
import DyanaNavbar from "../../components/DyanaNavbar";
export default function ComeFunziona() {
  const { t } = useI18n();

  return (
    <main className="page-root">
	  <DyanaNavbar />
      <section className="landing-wrapper">
        {/* TITOLO PAGINA */}
        <header className="section">
          <h1 className="section-title">{t("howItWorks.title")}</h1>
          <p className="section-subtitle">{t("howItWorks.subtitle")}</p>
        </header>

        {/* SEZIONE A STEP */}
        <section className="section">
          <div className="cards-grid">
            <article className="card">
              <h3 className="card-title">{t("howItWorks.steps.info.title")}</h3>
              <p className="card-text">{t("howItWorks.steps.info.text")}</p>
            </article>

            <article className="card">
              <h3 className="card-title">{t("howItWorks.steps.profile.title")}</h3>
              <p className="card-text">{t("howItWorks.steps.profile.text")}</p>
            </article>

            <article className="card">
              <h3 className="card-title">{t("howItWorks.steps.moment.title")}</h3>
              <p className="card-text">{t("howItWorks.steps.moment.text")}</p>
            </article>

            <article className="card">
              <h3 className="card-title">{t("howItWorks.steps.answer.title")}</h3>
              <p className="card-text">{t("howItWorks.steps.answer.text")}</p>
            </article>

            <article className="card">
              <h3 className="card-title">{t("howItWorks.steps.credits.title")}</h3>
              <p className="card-text">{t("howItWorks.steps.credits.text1")}</p>
              <p className="card-text" style={{ opacity: 0.85, marginTop: 10 }}>
                {t("howItWorks.steps.credits.text2")}
              </p>
            </article>

            <article className="card">
              <h3 className="card-title">{t("howItWorks.steps.freeCredits.title")}</h3>
              <p className="card-text">{t("howItWorks.steps.freeCredits.text1")}</p>
              <p className="card-text" style={{ opacity: 0.85, marginTop: 10 }}>
                {t("howItWorks.steps.freeCredits.text2")}
              </p>
            </article>

            <article className="card">
              <h3 className="card-title">
                {t("howItWorks.steps.horoscope2026.title")}
              </h3>
              <p className="card-text">
                {t("howItWorks.steps.horoscope2026.text1")}
              </p>
              <p className="card-text" style={{ opacity: 0.85, marginTop: 10 }}>
                {t("howItWorks.steps.horoscope2026.linkPrefix")}{" "}
                <a href="/oroscopo2026" style={{ textDecoration: "underline" }}>
                  {t("howItWorks.steps.horoscope2026.linkLabel")}
                </a>
              </p>
            </article>
          </div>
        </section>
      </section>
    </main>
  );
}