import "./globals.css";
import Script from "next/script";
import CookieBanner from "../components/CookieBanner";
import DyanaFooter from "../components/DyanaFooter";
import CapacitorFlag from "./CapacitorFlag";
import DeepLinkHandler from "./DeepLinkHandler";
import ConversionTracker from "../components/ConversionTracker";

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
export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <head>
        {/* Google tag globale */}
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

            // GA4
            gtag('config', '${GA4_ID}', {
              send_page_view: true
            });

            // Google Ads
            gtag('config', '${ADS_ID}', {
              send_page_view: false
            });
          `}
        </Script>
      </head>

      <body>
        <CapacitorFlag />
        <DeepLinkHandler />

        {/* Tracker conversioni globale */}
        <ConversionTracker />

        {children}

        <DyanaFooter />
        <CookieBanner />
      </body>
    </html>
  );
}
