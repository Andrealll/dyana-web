"use client";

import { useI18n } from "../../lib/i18n/useI18n";
import DyanaNavbar from "../../components/DyanaNavbar";

export default function CondizioniPage() {
  const { t } = useI18n();

  return (
    <main className="page-root">
      <DyanaNavbar />
      <section className="landing-wrapper">
        <section className="section">
          <div className="card" style={{ maxWidth: "800px", margin: "0 auto" }}>
            <h1 className="section-title">{t("terms.title")}</h1>

            <p className="card-text" style={{ fontSize: "0.9rem", opacity: 0.9 }}>
              {t("terms.intro")}
            </p>

            {/* 1. Oggetto */}
            <h2
              className="card-text"
              style={{ marginTop: 24, fontWeight: 600, fontSize: "0.95rem" }}
            >
              {t("terms.sections.service.title")}
            </h2>
            <p className="card-text" style={{ fontSize: "0.9rem", opacity: 0.9 }}>
              {t("terms.sections.service.text")}
            </p>

            {/* 2. Accesso */}
            <h2
              className="card-text"
              style={{ marginTop: 24, fontWeight: 600, fontSize: "0.95rem" }}
            >
              {t("terms.sections.access.title")}
            </h2>
            <p className="card-text" style={{ fontSize: "0.9rem", opacity: 0.9 }}>
              {t("terms.sections.access.intro")}
            </p>
            <ul
              className="card-text"
              style={{ fontSize: "0.9rem", opacity: 0.9, paddingLeft: 20 }}
            >
              <li>{t("terms.sections.access.guest")}</li>
              <li>{t("terms.sections.access.registered")}</li>
            </ul>
            <p className="card-text" style={{ fontSize: "0.9rem", opacity: 0.9 }}>
              {t("terms.sections.access.text")}
            </p>

            {/* 3. Crediti */}
            <h2
              className="card-text"
              style={{ marginTop: 24, fontWeight: 600, fontSize: "0.95rem" }}
            >
              {t("terms.sections.credits.title")}
            </h2>
            <p className="card-text" style={{ fontSize: "0.9rem", opacity: 0.9 }}>
              {t("terms.sections.credits.intro")}
            </p>
            <ul
              className="card-text"
              style={{ fontSize: "0.9rem", opacity: 0.9, paddingLeft: 20 }}
            >
              <li>{t("terms.sections.credits.item1")}</li>
              <li>{t("terms.sections.credits.item2")}</li>
              <li>{t("terms.sections.credits.item3")}</li>
            </ul>

            {/* 4. Dati inseriti */}
            <h2
              className="card-text"
              style={{ marginTop: 24, fontWeight: 600, fontSize: "0.95rem" }}
            >
              {t("terms.sections.userData.title")}
            </h2>
            <p className="card-text" style={{ fontSize: "0.9rem", opacity: 0.9 }}>
              {t("terms.sections.userData.text")}
            </p>

            {/* 5. Limitazioni */}
            <h2
              className="card-text"
              style={{ marginTop: 24, fontWeight: 600, fontSize: "0.95rem" }}
            >
              {t("terms.sections.limitations.title")}
            </h2>
            <p className="card-text" style={{ fontSize: "0.9rem", opacity: 0.9 }}>
              {t("terms.sections.limitations.text")}
            </p>

            {/* 6. Responsabilità */}
            <h2
              className="card-text"
              style={{ marginTop: 24, fontWeight: 600, fontSize: "0.95rem" }}
            >
              {t("terms.sections.liability.title")}
            </h2>
            <p className="card-text" style={{ fontSize: "0.9rem", opacity: 0.9 }}>
              {t("terms.sections.liability.text")}
            </p>

            {/* 7. Pagamenti */}
            <h2
              className="card-text"
              style={{ marginTop: 24, fontWeight: 600, fontSize: "0.95rem" }}
            >
              {t("terms.sections.payments.title")}
            </h2>
            <p className="card-text" style={{ fontSize: "0.9rem", opacity: 0.9 }}>
              {t("terms.sections.payments.text")}
            </p>

            {/* 8. Uso illecito */}
            <h2
              className="card-text"
              style={{ marginTop: 24, fontWeight: 600, fontSize: "0.95rem" }}
            >
              {t("terms.sections.prohibitedUse.title")}
            </h2>
            <p className="card-text" style={{ fontSize: "0.9rem", opacity: 0.9 }}>
              {t("terms.sections.prohibitedUse.text")}
            </p>

            {/* 9. Modifiche */}
            <h2
              className="card-text"
              style={{ marginTop: 24, fontWeight: 600, fontSize: "0.95rem" }}
            >
              {t("terms.sections.changes.title")}
            </h2>
            <p className="card-text" style={{ fontSize: "0.9rem", opacity: 0.9 }}>
              {t("terms.sections.changes.text")}
            </p>

            {/* 10. Durata e chiusura account */}
            <h2
              className="card-text"
              style={{ marginTop: 24, fontWeight: 600, fontSize: "0.95rem" }}
            >
              {t("terms.sections.duration.title")}
            </h2>
            <p className="card-text" style={{ fontSize: "0.9rem", opacity: 0.9 }}>
              {t("terms.sections.duration.text")}
            </p>

            {/* 11. Legge applicabile */}
            <h2
              className="card-text"
              style={{ marginTop: 24, fontWeight: 600, fontSize: "0.95rem" }}
            >
              {t("terms.sections.law.title")}
            </h2>
            <p
              className="card-text"
              style={{ fontSize: "0.9rem", opacity: 0.9, marginBottom: 8 }}
            >
              {t("terms.sections.law.text")}
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}