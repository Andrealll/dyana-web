// app/chat/page.jsx

export default function ChatPage() {
  return (
    <main className="page-root">
      <section className="landing-wrapper">
        {/* HEADER PAGINA CHAT */}
        <header className="section">
          <h1 className="section-title">Chat di DYANA</h1>
          <p className="section-subtitle">
            Qui potrai dialogare con DYANA, fare domande e ricevere risposte
            che uniscono sensibilità astrologica e chiarezza pratica.
          </p>
        </header>

        {/* CONTENITORE CHAT - PLACEHOLDER PER FUTURA INTEGRAZIONE */}
        <section className="section section-chat">
          <div className="chat-placeholder">
            <p className="chat-placeholder-text">
              In questa sezione integreremo il componente di chat: un&apos;area
              di messaggistica dove potrai scrivere a DYANA e leggere le sue
              risposte in tempo reale.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}
