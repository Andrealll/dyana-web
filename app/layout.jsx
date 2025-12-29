import "./globals.css";
import Script from "next/script";
import CookieBanner from "../components/CookieBanner";
import DyanaFooter from "../components/DyanaFooter";

export const metadata = {
  title: "DYANA",
  description: "L'assistente intuitivo che unisce astrologia e AI.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <head>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-FP10KYRWX5"
          strategy="beforeInteractive"
        />
        <Script id="gtag-init" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-FP10KYRWX5');
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
