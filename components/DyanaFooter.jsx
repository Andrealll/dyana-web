// components/DyanaFooter.jsx

export default function DyanaFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="diyana-footer">
      <div className="diyana-footer-inner">
        <p className="diyana-footer-text">
          DYANA offre interpretazioni astrologiche simboliche, generate con
          l&apos;aiuto dell&apos;intelligenza artificiale. Non rappresentano in
          alcun modo consulenze mediche, psicologiche, legali o finanziarie.
          Non crederci mai in modo cieco: prendile come spunti di riflessione
          e confrontale con la tua esperienza reale.
        </p>

        <div className="diyana-footer-right">
          <span className="diyana-footer-copy">
            © {currentYear} DYANA. Tutti i diritti riservati.
          </span>

          <a
            href="mailto:dyana.ai.app@gmail.com"
            className="diyana-footer-link"
          >
            Scrivimi
          </a>
        </div>
		<a href="/oroscopo2026" className="footer-link">
  Oroscopo 2026
</a>
      </div>
    </footer>
  );
}
