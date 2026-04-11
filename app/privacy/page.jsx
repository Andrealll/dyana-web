"use client";

import DyanaNavbar from "../../components/DyanaNavbar";
import { useI18n } from "../../lib/i18n/useI18n";

export default function PrivacyPage() {
  const { t } = useI18n();

  return (
    <main className="page-root">
      <DyanaNavbar />

      <section className="landing-wrapper">
        <section className="section">
          <div className="card" style={{ maxWidth: "800px", margin: "0 auto" }}>
            <h1 className="section-title">{t("privacy.title")}</h1>

            <p className="card-text" style={{ fontSize: "0.9rem", opacity: 0.9 }}>
              {t("privacy.intro")}
            </p>

            {/* 1. Titolare */}
            <h2
              className="card-text"
              style={{ marginTop: 24, fontWeight: 600, fontSize: "0.95rem" }}
            >
              {t("privacy.sections.controller.title")}
            </h2>
            <p className="card-text" style={{ fontSize: "0.9rem", opacity: 0.9, whiteSpace: "pre-line" }}>
              {t("privacy.sections.controller.text")}
            </p>

            {/* 2. Dati trattati */}
            <h2
              className="card-text"
              style={{ marginTop: 24, fontWeight: 600, fontSize: "0.95rem" }}
            >
              {t("privacy.sections.dataTypes.title")}
            </h2>
            <p className="card-text" style={{ fontSize: "0.9rem", opacity: 0.9 }}>
              {t("privacy.sections.dataTypes.intro")}
            </p>
            <ul
              className="card-text"
              style={{ fontSize: "0.9rem", opacity: 0.9, paddingLeft: 20 }}
            >
              <li>{t("privacy.sections.dataTypes.item1")}</li>
              <li>{t("privacy.sections.dataTypes.item2")}</li>
              <li>{t("privacy.sections.dataTypes.item3")}</li>
              <li>{t("privacy.sections.dataTypes.item4")}</li>
            </ul>

            {/* 3. Finalità */}
            <h2
              className="card-text"
              style={{ marginTop: 24, fontWeight: 600, fontSize: "0.95rem" }}
            >
              {t("privacy.sections.purposes.title")}
            </h2>
            <p className="card-text" style={{ fontSize: "0.9rem", opacity: 0.9 }}>
              {t("privacy.sections.purposes.intro")}
            </p>
            <ul
              className="card-text"
              style={{ fontSize: "0.9rem", opacity: 0.9, paddingLeft: 20 }}
            >
              <li>{t("privacy.sections.purposes.item1")}</li>
              <li>{t("privacy.sections.purposes.item2")}</li>
              <li>{t("privacy.sections.purposes.item3")}</li>
              <li>{t("privacy.sections.purposes.item4")}</li>
              <li>{t("privacy.sections.purposes.item5")}</li>
              <li>{t("privacy.sections.purposes.item6")}</li>
            </ul>

            {/* 4. Base giuridica */}
            <h2
              className="card-text"
              style={{ marginTop: 24, fontWeight: 600, fontSize: "0.95rem" }}
            >
              {t("privacy.sections.legalBasis.title")}
            </h2>
            <p className="card-text" style={{ fontSize: "0.9rem", opacity: 0.9 }}>
              {t("privacy.sections.legalBasis.intro")}
            </p>
            <ul
              className="card-text"
              style={{ fontSize: "0.9rem", opacity: 0.9, paddingLeft: 20 }}
            >
              <li>{t("privacy.sections.legalBasis.item1")}</li>
              <li>{t("privacy.sections.legalBasis.item2")}</li>
              <li>{t("privacy.sections.legalBasis.item3")}</li>
            </ul>

            {/* 5. Conservazione */}
            <h2
              className="card-text"
              style={{ marginTop: 24, fontWeight: 600, fontSize: "0.95rem" }}
            >
              {t("privacy.sections.retention.title")}
            </h2>
            <p className="card-text" style={{ fontSize: "0.9rem", opacity: 0.9 }}>
              {t("privacy.sections.retention.text")}
            </p>

            {/* 6. AI */}
            <h2
              className="card-text"
              style={{ marginTop: 24, fontWeight: 600, fontSize: "0.95rem" }}
            >
              {t("privacy.sections.ai.title")}
            </h2>
            <p className="card-text" style={{ fontSize: "0.9rem", opacity: 0.9 }}>
              {t("privacy.sections.ai.text")}
            </p>

            {/* 7. Destinatari */}
            <h2
              className="card-text"
              style={{ marginTop: 24, fontWeight: 600, fontSize: "0.95rem" }}
            >
              {t("privacy.sections.recipients.title")}
            </h2>
            <p className="card-text" style={{ fontSize: "0.9rem", opacity: 0.9 }}>
              {t("privacy.sections.recipients.text")}
            </p>

            {/* 8. Cookie */}
            <h2
              className="card-text"
              style={{ marginTop: 24, fontWeight: 600, fontSize: "0.95rem" }}
            >
              {t("privacy.sections.cookies.title")}
            </h2>
            <p className="card-text" style={{ fontSize: "0.9rem", opacity: 0.9 }}>
              {t("privacy.sections.cookies.text")}
            </p>

            {/* 9. Diritti */}
            <h2
              className="card-text"
              style={{ marginTop: 24, fontWeight: 600, fontSize: "0.95rem" }}
            >
              {t("privacy.sections.rights.title")}
            </h2>
            <p className="card-text" style={{ fontSize: "0.9rem", opacity: 0.9 }}>
              {t("privacy.sections.rights.text")}
            </p>

            {/* 10. Trasferimenti extra-UE */}
            <h2
              className="card-text"
              style={{ marginTop: 24, fontWeight: 600, fontSize: "0.95rem" }}
            >
              {t("privacy.sections.transfers.title")}
            </h2>
            <p className="card-text" style={{ fontSize: "0.9rem", opacity: 0.9 }}>
              {t("privacy.sections.transfers.text")}
            </p>

            {/* 11. Aggiornamenti */}
            <h2
              className="card-text"
              style={{ marginTop: 24, fontWeight: 600, fontSize: "0.95rem" }}
            >
              {t("privacy.sections.updates.title")}
            </h2>
            <p
              className="card-text"
              style={{ fontSize: "0.9rem", opacity: 0.9, marginBottom: 8 }}
            >
              {t("privacy.sections.updates.text")}
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}