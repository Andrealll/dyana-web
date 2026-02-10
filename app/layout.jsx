import "./globals.css";
import Script from "next/script";
import CookieBanner from "../components/CookieBanner";
import DyanaFooter from "../components/DyanaFooter";

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
          src="https://www.googletagmanager.com/gtag/js"
          strategy="afterInteractive"
        />

        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            // GA4
            gtag('config', '${GA4_ID}', {
              send_page_view: true
            });

            // Google Ads
            gtag('config', '${ADS_ID}');
          `}
        </Script>
      </head>

      <body>
        {children}
        <DyanaFooter />
        <CookieBanner />
      </body>
    </html>
  );
}
