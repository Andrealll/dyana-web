// app/layout.jsx
import "./globals.css";
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
      </body>
    </html>
  );
}
