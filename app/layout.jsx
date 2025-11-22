// app/layout.jsx
import "./globals.css";

export const metadata = {
  title: "DYANA",
  description: "L'assistente intuitivo che unisce astrologia e AI.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
