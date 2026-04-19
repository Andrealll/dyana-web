import Image from "next/image";
import DyanaNavbar from "../../components/DyanaNavbar";
import ForceEnglishLocale from "../../components/ForceEnglishLocale";

export const metadata = {
  title: "Personalized Astrology Reading | DYANA",
  description:
    "Stop generic horoscopes. Get a personalized astrology reading based on your real birth data with DYANA.",
  alternates: {
    canonical: "/en",
  },
};

export default function PageEN() {
  const year = new Date().getFullYear();

  return (
    <main className="page-root">
      <DyanaNavbar />
      <ForceEnglishLocale />

      <section className="splash-wrapper">
        <div className="splash-inner">
          <div className="splash-content">
            <div className="splash-column splash-column-main">
              <Image
                src="/dyana-logo.png"
                alt="DYANA"
                className="splash-logo-img"
                width={900}
                height={900}
                priority
              />

              <h1 className="section-title" style={{ marginTop: "1rem" }}>
                Your birth chart reveals what generic astrology never will
              </h1>

              <p className="splash-subtitle">
                Go beyond zodiac-sign content and start with a reading built on
                your real birth data.
              </p>

              <p className="splash-subtitle">
                See your deeper patterns, emotional dynamics, strengths, blind
                spots and the inner logic shaping how you move through life.
              </p>

              <div className="hero-actions" style={{ marginTop: "1.5rem" }}>
                <a href="https://dyana.app/en/tema" className="btn btn-primary">
                  Explore My Birth Chart
                </a>
              </div>

              <p
                className="card-text"
                style={{ marginTop: "1rem", opacity: 0.85 }}
              >
                Personalized • Clear • Based on your real birth data
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-features">
        <h2 className="section-title">Why generic astrology feels empty</h2>

        <p className="section-subtitle">
          “Big changes are coming.” “Trust your intuition.” “This is your
          moment.” You have seen these lines a hundred times because they are
          designed to fit almost anyone.
        </p>

        <p className="section-subtitle">
          They sound meaningful for a second, but they do not explain what is
          actually happening in your life, why certain patterns keep repeating,
          or where your real opportunities and tensions are.
        </p>

        <p className="section-subtitle">
          The issue is not astrology itself. The issue is astrology flattened
          into content for everyone — vague enough to feel good, but too generic
          to be useful.
        </p>
      </section>

      <section className="section section-features">
        <h2 className="section-title">What DYANA does differently</h2>

        <p className="section-subtitle">
          DYANA starts from your actual chart, not just your zodiac sign. It
          reads the structure behind your personality, emotional responses,
          timing and relationships.
        </p>

        <p className="section-subtitle">
          Then it turns that complexity into language you can actually use. No
          fake mystique. No decorative jargon. No universal advice pretending to
          be personal.
        </p>

        <p className="section-subtitle">
          The result is a reading that feels sharper, more accurate and far more
          useful than generic astrology content.
        </p>
      </section>

      <section className="section section-features">
        <h2 className="section-title">Choose where to start</h2>

        <p className="section-subtitle">
          If you want the deepest and most personal entry point, start with your
          birth chart. This is where you explore recurring patterns, emotional
          dynamics, natural talents, blind spots and the deeper structure of
          your life.
        </p>

        <div className="hero-actions" style={{ marginTop: "1rem" }}>
          <a href="/en/tema" className="btn btn-primary">
            Explore My Birth Chart
          </a>
        </div>

        <p className="section-subtitle" style={{ marginTop: "2.2rem" }}>
          If you want immediate clarity about your current phase, start with
          your personalized horoscope. It helps you understand what is moving
          now, where pressure is building and where momentum is opening.
        </p>

        <div className="hero-actions" style={{ marginTop: "1rem" }}>
          <a href="/oroscopo" className="btn btn-primary">
            See My Horoscope
          </a>
        </div>

        <p className="section-subtitle" style={{ marginTop: "2.2rem" }}>
          If your focus is love, attraction, misunderstanding or relational
          tension, start with compatibility. It shows how two people interact,
          what flows naturally, where friction appears and what the connection
          is really asking from both sides.
        </p>

        <div className="hero-actions" style={{ marginTop: "1rem" }}>
          <a href="/compatibilita" className="btn btn-primary">
            Check Compatibility
          </a>
        </div>
      </section>

      <section className="section section-features">
        <h2 className="section-title">What changes when the reading is real</h2>

        <p className="section-subtitle">
          A real personalized reading changes the experience completely.
          Instead of consuming something that could have been written for
          millions of strangers, you read something that reflects your own
          structure, timing and inner logic.
        </p>

        <p className="section-subtitle">
          That means more clarity, less noise. More recognition, less
          projection. More direction, less comforting nonsense.
        </p>

        <p className="section-subtitle">
          DYANA is built for people who want astrology to feel intelligent,
          personal and accurate — not decorative.
        </p>
      </section>

      <section className="section section-features">
        <h2 className="section-title">Start now</h2>

        <p className="section-subtitle">
          It takes less than a minute to begin. Start with your birth chart and
          see what changes when astrology stops speaking to everyone and starts
          speaking to you.
        </p>

        <div className="hero-actions" style={{ marginTop: "1.5rem" }}>
          <a href="/en/tema" className="btn btn-primary">
            Start My Personalized Reading
          </a>
        </div>
      </section>

      <footer className="footer">
        <p className="footer-text">
          <span className="footer-brand">DYANA</span> · all rights reserved ·{" "}
          {year}
        </p>
      </footer>
    </main>
  );
}