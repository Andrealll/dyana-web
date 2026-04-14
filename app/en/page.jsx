import Image from "next/image";
import DyanaNavbar from "../../components/DyanaNavbar";

export const metadata = {
  title: "Personalized Astrology Reading | DYANA",
  description:
    "Stop generic horoscopes. Get a real personalized astrology reading based on your data.",
};

export default function PageEN() {
  const year = new Date().getFullYear();

  return (
    <main className="page-root">
      <DyanaNavbar />

      {/* HERO */}
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
                This is not a generic horoscope
              </h1>

              <p className="splash-subtitle">
                Most astrology content sounds meaningful, but if you look closely,
                it’s written in a way that works for everyone.
              </p>

              <p className="splash-subtitle">
                That’s why it feels right for a moment, but doesn’t actually help you
                understand what is really happening in your life.
              </p>

              <p className="splash-subtitle">
                DYANA does something different. It builds your reading from your real
                birth data and translates it into something clear, direct and personal.
              </p>

              <div className="hero-actions" style={{ marginTop: "1.5rem" }}>
                <a href="/tema" className="btn btn-primary">
                  Start My Personalized Reading
                </a>
              </div>

              <p className="card-text" style={{ marginTop: "1rem", opacity: 0.8 }}>
                Takes less than 1 minute • Instant result • No generic content
              </p>

            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="section section-features">
        <h2 className="section-title">Why most astrology feels empty</h2>

        <p className="section-subtitle">
          You’ve probably seen phrases like “big changes are coming” or
          “this is an important year for you”. They sound specific, but they are not.
        </p>

        <p className="section-subtitle">
          They are designed to fit millions of people at the same time,
          which means they don’t really tell you anything about your situation.
        </p>

        <p className="section-subtitle">
          The result is simple: you read it, it resonates for a second,
          and then it disappears without giving you any real direction.
        </p>
      </section>

      {/* SOLUTION */}
      <section className="section section-features">
        <h2 className="section-title">What DYANA actually does</h2>

        <p className="section-subtitle">
          Instead of starting from your zodiac sign, DYANA works with your full chart.
          It looks at how the current movements interact with your personal structure.
        </p>

        <p className="section-subtitle">
          The output is not abstract language, but a reading that helps you understand
          patterns, tensions and opportunities in a way that is actually usable.
        </p>

        <p className="section-subtitle">
          You are not reading something written for everyone.
          You are reading something built around you.
        </p>
      </section>

      {/* PRODUCTS INLINE (testuali, non card) */}
      <section className="section section-features">
        <h2 className="section-title">What you can explore</h2>

        <p className="section-subtitle">
          If you want to understand what is happening right now, the personalized horoscope
          gives you a clear picture of your current phase and how to move within it.
          <br /><br />
          <a href="/oroscopo" className="btn btn-primary">
            See My Horoscope
          </a>
        </p>

        <p className="section-subtitle" style={{ marginTop: "2rem" }}>
          If you want something deeper, the birth chart reading helps you understand
          your personality, your emotional patterns and the way you tend to move through life.
          <br /><br />
          <a href="/tema" className="btn btn-primary">
            Explore My Chart
          </a>
        </p>

        <p className="section-subtitle" style={{ marginTop: "2rem" }}>
          If your focus is on relationships, the compatibility analysis shows
          how two people interact, where things flow naturally and where friction appears.
          <br /><br />
          <a href="/compatibilita" className="btn btn-primary">
            Check Compatibility
          </a>
        </p>
      </section>

      {/* VALUE */}
      <section className="section section-features">
        <h2 className="section-title">What changes when it’s personal</h2>

        <p className="section-subtitle">
          When a reading is built on your real data, it stops being entertainment
          and becomes something you can actually use.
        </p>

        <p className="section-subtitle">
          You start seeing recurring patterns more clearly, you understand why certain
          situations repeat, and you get a sense of direction instead of vague reassurance.
        </p>

        <p className="section-subtitle">
          The goal is not to impress you with complex language,
          but to give you clarity where before there was confusion.
        </p>
      </section>

      {/* FINAL CTA */}
      <section className="section section-features">
        <h2 className="section-title">
          Start your reading now
        </h2>

        <p className="section-subtitle">
          It takes less than a minute to generate your first reading,
          and you can immediately go deeper if you want to explore further.
        </p>

        <div className="hero-actions" style={{ marginTop: "1.5rem" }}>
          <a href="/tema" className="btn btn-primary">
            Start Now
          </a>
        </div>
      </section>

      <footer className="footer">
        <p className="footer-text">
          <span className="footer-brand">DYANA</span> · all rights reserved · {year}
        </p>
      </footer>
    </main>
  );
}