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
  See what this month means for you — and what the Aries New Moon is opening next
</h1>

<p className="splash-subtitle">
  Start with your personalized horoscope to understand what is shifting
  right now and where your energy is actually moving.
</p>

<p className="splash-subtitle">
  With the Aries New Moon building, this is a key moment to see what is
  starting, what needs action, and where real momentum is emerging in your life.
</p>

<p className="splash-subtitle">
  If you want clarity that is not generic, this is where to begin.
</p>

<div className="hero-actions" style={{ marginTop: "1.5rem" }}>
  <a href="/oroscopo" className="btn btn-primary">
    See My Monthly Horoscope
  </a>
</div>

<p
  className="card-text"
  style={{ marginTop: "1rem", opacity: 0.85 }}
>
  Instant result • Personalized • Focused on this month and the days ahead
</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-features">
        <h2 className="section-title">Why generic astrology fails</h2>

        <p className="section-subtitle">
          “Big changes are coming.” “Trust your intuition.” “This is your
          moment.” You have read these lines a hundred times because they are
          made to fit almost anyone.
        </p>

        <p className="section-subtitle">
          They create the illusion of meaning, but they do not tell you what is
          actually moving in your life, why certain patterns keep repeating, or
          where your real opportunities and tensions are.
        </p>

        <p className="section-subtitle">
          The problem is not astrology itself. The problem is lazy astrology.
          Content written to be universal ends up feeling empty. It may sound
          poetic, but it does not give direction.
        </p>
      </section>

      <section className="section section-features">
        <h2 className="section-title">What DYANA does differently</h2>

        <p className="section-subtitle">
          DYANA starts from your actual chart, not just your zodiac sign. It
          reads the structure behind your personality, your emotional patterns,
          your timing and your relationships.
        </p>

        <p className="section-subtitle">
          Then it translates that complexity into language you can actually
          understand. No unnecessary jargon. No fake mystery. No generic “advice
          for everyone”. Just a reading built around you.
        </p>

        <p className="section-subtitle">
          This is the difference between consuming astrology content and seeing
          yourself more clearly through it.
        </p>
      </section>

      <section className="section section-features">
        <h2 className="section-title">Choose what you want to explore</h2>

        <p className="section-subtitle">
          If what you want is immediate clarity about your current phase, start
          with your personalized horoscope. It helps you understand what is
          moving now, where the pressure is, and where the momentum really is.
        </p>

        <div className="hero-actions" style={{ marginTop: "1rem" }}>
          <a href="/oroscopo" className="btn btn-primary">
            See My Horoscope
          </a>
        </div>

        <p className="section-subtitle" style={{ marginTop: "2.2rem" }}>
          If you want a deeper reading, go to your birth chart. This is where
          you explore personality, emotional dynamics, recurring patterns,
          strengths, blind spots and the deeper logic behind how you move
          through life.
        </p>

        <div className="hero-actions" style={{ marginTop: "1rem" }}>
          <a href="/tema" className="btn btn-primary">
            Explore My Birth Chart
          </a>
        </div>

        <p className="section-subtitle" style={{ marginTop: "2.2rem" }}>
          If your focus is on love, tension, attraction or misunderstanding,
          start with compatibility. It helps you see how two people interact,
          what flows naturally, where friction appears and what the relationship
          is really asking from both sides.
        </p>

        <div className="hero-actions" style={{ marginTop: "1rem" }}>
          <a href="/compatibilita" className="btn btn-primary">
            Check Compatibility
          </a>
        </div>
      </section>

      <section className="section section-features">
        <h2 className="section-title">What you get when the reading is real</h2>

        <p className="section-subtitle">
          A personalized reading changes the experience completely. Instead of
          consuming something that could have been written for millions of
          strangers, you start reading something that reflects your structure,
          your timing and your inner logic.
        </p>

        <p className="section-subtitle">
          That means more clarity, less noise. More recognition, less
          projection. More direction, less comforting nonsense.
        </p>

        <p className="section-subtitle">
          DYANA is designed for people who want astrology to feel accurate,
          intelligent and personal — not decorative.
        </p>
      </section>

      <section className="section section-features">
        <h2 className="section-title">Start now</h2>

        <p className="section-subtitle">
          It takes less than a minute to begin. Choose the reading that fits
          what you need most right now and see what changes when astrology stops
          talking to everyone and starts talking to you.
        </p>

        <div className="hero-actions" style={{ marginTop: "1.5rem" }}>
          <a href="/tema" className="btn btn-primary">
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