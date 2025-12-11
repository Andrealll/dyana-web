// app/layout.jsx
import "./globals.css";
import Script from "next/script";
import CookieBanner from "../components/CookieBanner";

export const metadata = {
  title: "DYANA",
  description: "L'assistente intuitivo che unisce astrologia e AI.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body>
        {children}
        <CookieBanner />

        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-FP10KYRWX5"
          strategy="afterInteractive"
        />

        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-FP10KYRWX5');
          `}
        </Script>
      </body>
    </html>
  );
}
