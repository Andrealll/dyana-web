import "./globals.css";
import Script from "next/script";
import CookieBanner from "../components/CookieBanner";
import DyanaFooter from "../components/DyanaFooter";

export const metadata = {
  title: "DYANA",
  description: "L'assistente intuitivo che unisce astrologia e AI.",
};

const GA4_ID = "G-FP10KYRWX5";
const ADS_ID = "AW-17796576310";

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <head>
        {/* Google tag (carica gtag una sola volta) */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
          strategy="beforeInteractive"
        />
        <Script id="gtag-init" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            gtag('js', new Date());

            // GA4
            gtag('config', '${GA4_ID}');

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
