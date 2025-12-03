// app/test-typebot/page.jsx
"use client";

export default function TestTypebotPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#15191c",
        color: "#f5f5ff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "24px",
      }}
    >
      <h1 style={{ marginBottom: "16px" }}>Test embed Typebot</h1>
      <p style={{ marginBottom: "16px", opacity: 0.8 }}>
        Semplice iframe verso <code>https://typebot.co/dyana-ai</code> su
        dominio dyana.app
      </p>
      <div
        style={{
          width: "100%",
          maxWidth: "960px",
          height: "600px",
          borderRadius: "14px",
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 22px 48px rgba(0,0,0,0.75)",
        }}
      >
        <iframe
          src="https://typebot.co/dyana-ai"
          style={{
            border: "none",
            width: "100%",
            height: "100%",
          }}
          allow="clipboard-write; microphone; camera"
        />
      </div>
    </main>
  );
}
