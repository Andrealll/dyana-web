"use client";

import { useState } from "react";

interface PersonaForm {
  nome: string;
  citta: string;
  data: string; // YYYY-MM-DD
  ora: string;  // HH:MM
}

const initialPersona: PersonaForm = {
  nome: "",
  citta: "",
  data: "",
  ora: "",
};

export default function CompatibilitaPage() {
  const [personaA, setPersonaA] = useState<PersonaForm>(initialPersona);
  const [personaB, setPersonaB] = useState<PersonaForm>(initialPersona);
  const [loading, setLoading] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [risultato, setRisultato] = useState<any | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrore(null);
    setRisultato(null);

    try {
      const res = await fetch("/api/sinastria_ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          A: {
            nome: personaA.nome,
            citta: personaA.citta,
            data: personaA.data,
            ora: personaA.ora,
          },
          B: {
            nome: personaB.nome,
            citta: personaB.citta,
            data: personaB.data,
            ora: personaB.ora,
          },
          tier: "free",
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData?.error ||
            `Errore chiamando l'API (status ${res.status})`
        );
      }

      const data = await res.json();
      setRisultato(data);
    } catch (err: any) {
      setErrore(err?.message ?? "Errore sconosciuto");
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
        {/* Due colonne: Persona A / Persona B */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Persona A */}
          <div className="rounded-xl border p-4 space-y-4">
            <h2 className="text-lg font-medium">Persona A</h2>

            <div className="space-y-1">
              <label className="text-sm font-medium">Nome</label>
              <input
                type="text"
                className="w-full rounded-md border px-3 py-2 text-sm"
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
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={personaA.citta}
                onChange={(e) =>
                  setPersonaA((old) => ({ ...old, citta: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Data di nascita</label>
              <input
                type="date"
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={personaA.data}
                onChange={(e) =>
                  setPersonaA((old) => ({ ...old, data: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Ora di nascita</label>
              <input
                type="time"
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={personaA.ora}
                onChange={(e) =>
                  setPersonaA((old) => ({ ...old, ora: e.target.value }))
                }
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
                className="w-full rounded-md border px-3 py-2 text-sm"
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
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={personaB.citta}
                onChange={(e) =>
                  setPersonaB((old) => ({ ...old, citta: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Data di nascita</label>
              <input
                type="date"
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={personaB.data}
                onChange={(e) =>
                  setPersonaB((old) => ({ ...old, data: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Ora di nascita</label>
              <input
                type="time"
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={personaB.ora}
                onChange={(e) =>
                  setPersonaB((old) => ({ ...old, ora: e.target.value }))
                }
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
        <div className="rounded-md border border-red-400/60 bg-red-50/60 px-4 py-3 text-sm text-red-800">
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
