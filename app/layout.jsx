import "./globals.css";
import Script from "next/script";
import { headers } from "next/headers";
import CookieBanner from "../components/CookieBanner";
import DyanaFooter from "../components/DyanaFooter";
import CapacitorFlag from "./CapacitorFlag";
import DeepLinkHandler from "./DeepLinkHandler";
import ConversionTracker from "../components/ConversionTracker";
import I18nProvider from "../lib/i18n/I18nProvider";

// ==========================
// SEO METADATA (CANONICAL HOME)
// ==========================
export const metadata = {
  metadataBase: new URL("https://dyana.app"),
  title: "DYANA",
  description: "L'assistente intuitivo che unisce astrologia e AI.",
  alternates: {
    canonical: "/",
  },
};

// ==========================
// TRACKING IDS
// ==========================
const GA4_ID = "G-FP10KYRWX5";
const ADS_ID = "AW-17796576310";

// ==========================
// ROOT LAYOUT
// ==========================
export default async function RootLayout({ children }) {
  const headersList = await headers();
  const lang = headersList.get("x-dyana-lang") || "it";

  return (
    <html lang={lang}>
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
          strategy="beforeInteractive"
        />

        <Script id="gtag-init" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('js', new Date());

            gtag('consent', 'default', {
              ad_storage: 'denied',
              analytics_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied'
            });

            gtag('config', '${GA4_ID}', {
              send_page_view: true
            });

            gtag('config', '${ADS_ID}', {
              send_page_view: false
            });
          `}
        </Script>
      </head>
      <body>
        <CapacitorFlag />
        <DeepLinkHandler />
        <ConversionTracker />

        <I18nProvider>
          {children}
          <DyanaFooter />
          <CookieBanner />
        </I18nProvider>
      </body>
    </html>
  );
}