// components/DyanaFooter.jsx
"use client";

import { useI18n } from "../lib/i18n/useI18n";

export default function DyanaFooter() {
  const { t } = useI18n();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="diyana-footer">
      <div className="diyana-footer-inner">
        <p className="diyana-footer-text">
          {t("footer.disclaimer")}
        </p>

        <div className="diyana-footer-right">
          <span className="diyana-footer-copy">
            © {currentYear} DYANA. {t("common.footer.rightsReserved")}
          </span>

          <a
            href="mailto:dyana.ai.app@gmail.com"
            className="diyana-footer-link"
          >
            {t("footer.contact")}
          </a>
        </div>

        <a href="/oroscopo2026" className="footer-link">
          {t("footer.oroscope2026")}
        </a>
      </div>
    </footer>
  );
}