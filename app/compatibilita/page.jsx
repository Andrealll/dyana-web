// app/compatibilita/page.jsx

"use client";

import { useState } from "react";

const initialPersona = {
  nome: "",
  citta: "",
  data: "",
  ora: "",
};

export default function CompatibilitaPage() {
  const [personaA, setPersonaA] = useState(initialPersona);
  const [personaB, setPersonaB] = useState(initialPersona);
  const [loading, setLoading] = useState(false);
  const [errore, setErrore] = useState(null);
  const [risultato, setRisultato] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setErrore(null);
    setRisultato(null);

    try {
      const payload = {
        A: {
          citta: personaA.citta,
          data: personaA.data,
          ora: personaA.ora,
          nome: personaA.nome || null,
        },
        B: {
          citta: personaB.citta,
          data: personaB.data,
          ora: personaB.ora,
          nome: personaB.nome || null,
        },
        tier: "free",
      };

      console.log("[DYANA] Submit compatibilità payload:", payload);

      const res = await fetch("/api/sinastria_ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        let msg =
          (data && (data.error || data.backend || JSON.stringify(data))) ||
          `Errore chiamando l'API (status ${res.status})`;

        throw new Error(
          typeof msg === "string" ? msg : JSON.stringify(msg, null, 2)
        );
      }

      setRisultato(data);
    } catch (err) {
      setErrore(err?.message || "Errore sconosciuto");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      {/* Titolo */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Compatibilità di Coppia
        </h1>
        <p className="text-sm opacity-80">
          Inserisci i dati delle due persone per calcolare la sinastria
          astrologica con AstroBot.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Due card: Persona A / Persona B */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Persona A */}
          <div className="rounded-xl border p-4 space-y-4">
            <h2 className="text-lg font-medium">Persona A</h2>

            <div className="space-y-1">
              <label className="text-sm font-medium">Nome</label>
              <input
                type="text"
                className="w-full rounded-md border px-3 py-2 text-sm bg-transparent"
                value={personaA.nome}
                onChange={(e) =>
                  setPersonaA((old) => ({ ...old, nome: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Città</label>
              <input
                type="text"
                className="w-full rounded-md border px-3 py-2 text-sm bg-transparent"
                value={personaA.citta}
                onChange={(e) =>
                  setPersonaA((old) => ({ ...old, citta: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Data di nascita</label>
              <input
                type="date"
                className="w-full rounded-md border px-3 py-2 text-sm bg-transparent"
                value={personaA.data}
                onChange={(e) =>
                  setPersonaA((old) => ({ ...old, data: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Ora di nascita</label>
              <input
                type="time"
                className="w-full rounded-md border px-3 py-2 text-sm bg-transparent"
                value={personaA.ora}
                onChange={(e) =>
                  setPersonaA((old) => ({ ...old, ora: e.target.value }))
                }
                required
              />
            </div>
          </div>

          {/* Persona B */}
          <div className="rounded-xl border p-4 space-y-4">
            <h2 className="text-lg font-medium">Persona B</h2>

            <div className="space-y-1">
              <label className="text-sm font-medium">Nome</label>
              <input
                type="text"
                className="w-full rounded-md border px-3 py-2 text-sm bg-transparent"
                value={personaB.nome}
                onChange={(e) =>
                  setPersonaB((old) => ({ ...old, nome: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Città</label>
              <input
                type="text"
                className="w-full rounded-md border px-3 py-2 text-sm bg-transparent"
                value={personaB.citta}
                onChange={(e) =>
                  setPersonaB((old) => ({ ...old, citta: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Data di nascita</label>
              <input
                type="date"
                className="w-full rounded-md border px-3 py-2 text-sm bg-transparent"
                value={personaB.data}
                onChange={(e) =>
                  setPersonaB((old) => ({ ...old, data: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Ora di nascita</label>
              <input
                type="time"
                className="w-full rounded-md border px-3 py-2 text-sm bg-transparent"
                value={personaB.ora}
                onChange={(e) =>
                  setPersonaB((old) => ({ ...old, ora: e.target.value }))
                }
                required
              />
            </div>
          </div>
        </div>

        {/* Bottone */}
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={loading}
            className="rounded-full px-6 py-2 text-sm font-medium border hover:opacity-80 disabled:opacity-60"
          >
            {loading ? "Calcolo in corso..." : "Calcola compatibilità"}
          </button>
        </div>
      </form>

      {/* Messaggi / risultato */}
      {errore && (
        <div className="rounded-md border border-red-400/60 bg-red-50/10 px-4 py-3 text-sm text-red-300">
          Errore: {errore}
        </div>
      )}

      {risultato && (
        <div className="space-y-3">
          <h2 className="text-lg font-medium">Risultato della sinastria</h2>
          <p className="text-sm opacity-80">
            Questa è la risposta completa del motore AstroBot. In un secondo
            momento potremo formattarla meglio (titoli, blocchi, paragrafi).
          </p>
          <pre className="max-h-[500px] overflow-auto rounded-lg border px-4 py-3 text-xs">
            {JSON.stringify(risultato, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
