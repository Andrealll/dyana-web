// app/page.jsx

"use client";

import Image from "next/image";
import DyanaNavbar from "../components/DyanaNavbar";
import CookieBanner from "../components/CookieBanner";
import { useI18n } from "../lib/i18n/useI18n";

export default function Home() {
  const year = new Date().getFullYear();
  const { t } = useI18n();

  return (
    <main className="page-root">
      {/* NAVBAR PRINCIPALE */}
      <DyanaNavbar />

      {/* HERO / SPLASH */}
      <section className="splash-wrapper">
        <div className="splash-inner">
          <div className="splash-content">
            {/* BLOCCO LOGO + TESTO INTRO */}
            <div className="splash-column splash-column-main">
              <Image
                src="/dyana-logo.png"
                alt="DYANA"
                className="splash-logo-img"
                width={1000}
                height={1000}
                priority
              />

              <p className="splash-subtitle">
                {t("home.hero.subtitle1")}
              </p>

              <p className="splash-subtitle">
                {t("home.hero.subtitle2")}
              </p>
            </div>

            {/* BLOCCO AZIONI PRINCIPALI */}
            <div className="splash-column splash-column-actions">
              <h2 className="section-title" style={{ marginBottom: "1.5rem" }}>
                {t("home.hero.startTitle")}
              </h2>

              {/* PRIMA RIGA: PRODOTTI PRINCIPALI */}
              <div
                className="hero-actions"
                style={{ display: "flex", flexWrap: "wrap", gap: 12 }}
              >
                <a href="/oroscopo" className="btn btn-primary">
                  {t("home.cta.horoscope")}
                </a>
                <a href="/tema" className="btn btn-primary">
                  {t("home.cta.birthChartFull")}
                </a>
                <a href="/compatibilita" className="btn btn-primary">
                  {t("home.cta.compatibility")}
                </a>
              </div>

              {/* SECONDA RIGA: LINK EXTRA */}
              <div
                className="hero-actions"
                style={{ marginTop: "1rem", display: "flex", flexWrap: "wrap", gap: 12 }}
              >
                <a href="/oroscopo2026" className="btn btn-secondary">
                  {t("home.cta.horoscope2026")}
                </a>
              </div>

              {/* SECONDA RIGA: INFO + ACCOUNT + CREDITI + PRIVACY */}
              <div className="hero-actions" style={{ marginTop: "1.5rem" }}>
                <a href="/come-funziona" className="btn btn-secondary">
                  {t("home.cta.howItWorks")}
                </a>
                <a href="/login" className="btn btn-secondary">
                  {t("home.cta.login")}
                </a>
                <a href="/area-personale" className="btn btn-secondary">
                  {t("home.cta.personalArea")}
                </a>
                <a href="/crediti" className="btn btn-secondary">
                  {t("home.cta.buyPremium")}
                </a>
                <a href="/privacy" className="btn btn-secondary">
                  {t("home.cta.privacy")}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LANDING PRINCIPALE */}
      <section id="landing" className="landing-wrapper">
        {/* SEZIONE: PERCHÉ NON È L'OROSCOPO COPIA-INCOLLA */}
        <section className="section section-features">
          <h2 className="section-title">{t("home.features.title")}</h2>
          <p className="section-subtitle">{t("home.features.subtitle")}</p>

          <div className="cards-grid">
            <article className="card">
              <h3 className="card-title">{t("home.features.profile.title")}</h3>
              <p className="card-text">{t("home.features.profile.text")}</p>
            </article>

            <article className="card">
              <h3 className="card-title">{t("home.features.ai.title")}</h3>
              <p className="card-text">{t("home.features.ai.text")}</p>
            </article>

            <article className="card">
              <h3 className="card-title">
                {t("home.features.personalAstrologer.title")}
              </h3>
              <p className="card-text">
                {t("home.features.personalAstrologer.text")}
              </p>
            </article>
          </div>
        </section>

        {/* SEZIONE: COSA PUOI CHIEDERE A DYANA */}
        <section className="section section-features">
          <h2 className="section-title">{t("home.tools.title")}</h2>
          <p className="section-subtitle">{t("home.tools.subtitle")}</p>

          <div className="cards-grid">
            <article className="card">
              <h3 className="card-title">{t("home.tools.horoscope.title")}</h3>
              <p className="card-text">{t("home.tools.horoscope.text")}</p>
              <a href="/oroscopo" className="btn btn-primary">
                {t("home.tools.horoscope.button")}
              </a>
            </article>

            <article className="card">
              <h3 className="card-title">{t("home.tools.birthChart.title")}</h3>
              <p className="card-text">{t("home.tools.birthChart.text")}</p>
              <a href="/tema" className="btn btn-primary">
                {t("home.tools.birthChart.button")}
              </a>
            </article>

            <article className="card">
              <h3 className="card-title">
                {t("home.tools.compatibility.title")}
              </h3>
              <p className="card-text">{t("home.tools.compatibility.text")}</p>
              <a href="/compatibilita" className="btn btn-primary">
                {t("home.tools.compatibility.button")}
              </a>
            </article>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="footer">
          <p className="footer-text">
            <span className="footer-brand">DYANA</span> ·{" "}
            {t("common.footer.rightsReserved")} · {year}
          </p>
        </footer>
      </section>
    </main>
  );
}