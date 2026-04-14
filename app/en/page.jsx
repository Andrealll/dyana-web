"use client";

import Link from "next/link";
import DyanaNavbar from "../../components/DyanaNavbar";
import DyanaFooter from "../../components/DyanaFooter";

export default function PageEN() {
  return (
    <>
      <DyanaNavbar />

      <main style={{ maxWidth: "820px", margin: "0 auto", padding: "40px 20px" }}>
        
        {/* HERO */}
        <section style={{ textAlign: "center", marginBottom: "40px" }}>
          <h1 style={{ fontSize: "38px", marginBottom: "16px" }}>
            This is not a generic horoscope
          </h1>

          <p style={{ fontSize: "18px", marginBottom: "24px" }}>
            Get a personalized astrology reading based on your real data.  
            Understand yourself, your patterns, and your relationships.
          </p>

          <Link href="/tema">
            <button style={{ padding: "16px 24px", fontSize: "16px" }}>
              Get My Personalized Reading
            </button>
          </Link>

          <p style={{ marginTop: "10px", fontSize: "14px", opacity: 0.7 }}>
            Takes less than 1 minute
          </p>
        </section>

        {/* TRUST BLOCK */}
        <section style={{ marginBottom: "40px", textAlign: "center" }}>
          <p style={{ fontSize: "16px" }}>
            ✔ Not a quiz  
            ✔ Not generic predictions  
            ✔ Based on your birth data  
          </p>
        </section>

        {/* VALUE */}
        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ marginBottom: "16px" }}>
            What you’ll get
          </h2>

          <ul style={{ lineHeight: "1.9" }}>
            <li>Personal insights about your personality</li>
            <li>Understanding of your emotional patterns</li>
            <li>Clarity on your relationships</li>
            <li>Actionable guidance, not vague predictions</li>
          </ul>
        </section>

        {/* OPTIONS */}
        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ marginBottom: "16px" }}>
            Choose your reading
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            <Link href="/oroscopo">
              <div style={{ border: "1px solid #ddd", padding: "16px", borderRadius: "10px" }}>
                <strong>Personalized Horoscope</strong>
                <p style={{ margin: 0 }}>Daily insights based on your chart</p>
              </div>
            </Link>

            <Link href="/tema">
              <div style={{ border: "1px solid #ddd", padding: "16px", borderRadius: "10px" }}>
                <strong>Birth Chart Reading</strong>
                <p style={{ margin: 0 }}>Deep analysis of who you are</p>
              </div>
            </Link>

            <Link href="/compatibilita">
              <div style={{ border: "1px solid #ddd", padding: "16px", borderRadius: "10px" }}>
                <strong>Compatibility Analysis</strong>
                <p style={{ margin: 0 }}>Understand your relationship dynamics</p>
              </div>
            </Link>

          </div>
        </section>

        {/* OBJECTION HANDLING */}
        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ marginBottom: "16px" }}>
            Why this is different
          </h2>

          <p>
            Most astrology apps give you generic content based only on your sign.
            DYANA uses your full birth data and AI to generate a reading tailored to you.
          </p>
        </section>

        {/* FINAL CTA */}
        <section style={{ textAlign: "center", marginTop: "40px" }}>
          <h2 style={{ marginBottom: "16px" }}>
            Start your reading now
          </h2>

          <Link href="/tema">
            <button style={{ padding: "16px 24px", fontSize: "16px" }}>
              Start Now
            </button>
          </Link>

          <p style={{ marginTop: "10px", fontSize: "14px", opacity: 0.7 }}>
            Instant result • No generic content
          </p>
        </section>

      </main>

      <DyanaFooter />
    </>
  );
}