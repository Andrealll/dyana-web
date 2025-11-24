"use client";

import { useState } from "react";

type PersonaForm = {
  nome: string;
  citta: string;
  data: string; // YYYY-MM-DD
  ora: string;  // HH:MM
};

type Tier = "free" | "premium";

type SinastriaAI = {
  sintesi_generale?: string;
  meta?: {
    tier?: Tier;
    lingua?: string;
    nome_A?: string | null;
    nome_B?: string | null;
    riassunto_tono?: string;
  };
  aree_relazione?: {
    id: string;
    titolo: string;
    sintesi: string;
    forza?: string;
    dinamica?: string;
    aspetti_principali?: { descrizione: string; nota?: string | null }[];
    consigli_pratici?: string[];
  }[];
  punti_forza?: string[];
  punti_criticita?: string[];
  consigli_finali?: string[];
};

export default function SinastriaPage() {
  const [A, setA] = useState<PersonaForm>({
    nome: "",
    citta: "",
    data: "",
    ora: "",
  });

  const [B, setB] = useState<PersonaForm>({
    nome: "",
    citta: "",
    data: "",
    ora: "",
  });

  const [tier, setTier] = useState<Tier>("free");

  const [loading, setLoading] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [result, setResult] = useState<SinastriaAI | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrore(null);
    setResult(null);
    setLoading(true);

    try {
      const body = {
        A: {
          nome: A.nome || null,
          citta: A.citta,
          data: A.data,
          ora: A.ora,
        },
        B: {
          nome: B.nome || null,
          citta: B.citta,
          data: B.data,
          ora: B.ora,
        },
        tier,
      };

      const res = await fetch("/api/sinastria_ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        console.error("Errore HTTP /api/sinastria_ai:", res.status);
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();

      const sinastria_ai: SinastriaAI | null = data?.sinastria_ai ?? null;

      if (!sinastria_ai) {
        setErrore(
          "Si è verificato un errore durante il calcolo della compatibilità. Verifica i dati inseriti o riprova tra poco."
        );
      } else {
        setResult(sinastria_ai);
      }
    } catch (err) {
      console.error("Errore sinastria_ai:", err);
      setErrore(
        "Si è verificato un errore durante il calcolo della compatibilità. Verifica i dati inseriti o riprova tra poco."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-semibold mb-4">
        Compatibilità di coppia DYANA (sinastria_ai)
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Persona A */}
        <fieldset className="border rounded-lg p-4 space-y-4">
          <legend className="px-2 font-medium">Persona A</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1 text-sm">
              Nome (facoltativo)
              <input
                type="text"
                value={A.nome}
                onChange={(e) => setA((f) => ({ ...f, nome: e.target.value }))}
                className="border rounded px-2 py-1"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Città
              <input
                type="text"
                value={A.citta}
                onChange={(e) =>
                  setA((f) => ({ ...f, citta: e.target.value }))
                }
                className="border rounded px-2 py-1"
                required
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Data di nascita
              <input
                type="date"
                value={A.data}
                onChange={(e) =>
                  setA((f) => ({ ...f, data: e.target.value }))
                }
                className="border rounded px-2 py-1"
                required
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Ora di nascita
              <input
                type="time"
                value={A.ora}
                onChange={(e) => setA((f) => ({ ...f, ora: e.target.value }))}
                className="border rounded px-2 py-1"
                required
              />
            </label>
          </div>
        </fieldset>

        {/* Persona B */}
        <fieldset className="border rounded-lg p-4 space-y-4">
          <legend className="px-2 font-medium">Persona B</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1 text-sm">
              Nome (facoltativo)
              <input
                type="text"
                value={B.nome}
                onChange={(e) => setB((f) => ({ ...f, nome: e.target.value }))}
                className="border rounded px-2 py-1"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Città
              <input
                type="text"
                value={B.citta}
                onChange={(e) =>
                  setB((f) => ({ ...f, citta: e.target.value }))
                }
                className="border rounded px-2 py-1"
                required
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Data di nascita
              <input
                type="date"
                value={B.data}
                onChange={(e) =>
                  setB((f) => ({ ...f, data: e.target.value }))
                }
                className="border rounded px-2 py-1"
                required
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Ora di nascita
              <input
                type="time"
                value={B.ora}
                onChange={(e) => setB((f) => ({ ...f, ora: e.target.value }))}
                className="border rounded px-2 py-1"
                required
              />
            </label>
          </div>
        </fieldset>

        {/* Tier */}
        <fieldset className="border rounded-lg p-4 space-y-2">
          <legend className="px-2 font-medium">Livello</legend>
          <div className="flex gap-4 text-sm">
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                value="free"
                checked={tier === "free"}
                onChange={() => setTier("free")}
              />
              Free
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                value="premium"
                checked={tier === "premium"}
                onChange={() => setTier("premium")}
              />
              Premium
            </label>
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded bg-black text-white text-sm disabled:opacity-60"
        >
          {loading ? "Calcolo in corso..." : "Calcola compatibilità"}
        </button>
      </form>

      {errore && <p className="text-sm text-red-600">{errore}</p>}

      {result && (
        <section className="mt-6 space-y-4">
          {result.sintesi_generale && (
            <div>
              <h2 className="text-lg font-semibold mb-1">Sintesi generale</h2>
              <p className="text-sm">{result.sintesi_generale}</p>
            </div>
          )}

          {result.meta && (
            <div className="text-xs text-gray-600">
              <span>
                Tier: <strong>{result.meta.tier}</strong>
              </span>
              {result.meta.riassunto_tono && (
                <>
                  {" • "}
                  <span>{result.meta.riassunto_tono}</span>
                </>
              )}
            </div>
          )}

          {result.aree_relazione && result.aree_relazione.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-base font-semibold">Aree della relazione</h3>
              {result.aree_relazione.map((area) => (
                <article
                  key={area.id}
                  className="border rounded-lg p-3 space-y-2 text-sm"
                >
                  <h4 className="font-medium">{area.titolo}</h4>
                  <p>{area.sintesi}</p>

                  {area.aspetti_principali &&
                    area.aspetti_principali.length > 0 && (
                      <div className="space-y-1">
                        <p className="font-semibold text-xs">
                          Aspetti principali:
                        </p>
                        <ul className="list-disc list-inside text-xs space-y-1">
                          {area.aspetti_principali.map((asp, idx) => (
                            <li key={idx}>
                              {asp.descrizione}
                              {asp.nota && (
                                <span className="text-gray-500">
                                  {" "}
                                  — {asp.nota}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {area.consigli_pratici &&
                    area.consigli_pratici.length > 0 && (
                      <div className="space-y-1">
                        <p className="font-semibold text-xs">
                          Consigli pratici:
                        </p>
                        <ul className="list-disc list-inside text-xs space-y-1">
                          {area.consigli_pratici.map((c, idx) => (
                            <li key={idx}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                </article>
              ))}
            </div>
          )}

          {(result.punti_forza || result.punti_criticita) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {result.punti_forza && result.punti_forza.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-1">Punti di forza</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {result.punti_forza.map((p, idx) => (
                      <li key={idx}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.punti_criticita && result.punti_criticita.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-1">Punti di criticità</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {result.punti_criticita.map((p, idx) => (
                      <li key={idx}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {result.consigli_finali && result.consigli_finali.length > 0 && (
            <div className="text-sm">
              <h3 className="font-semibold mb-1">Consigli finali</h3>
              <ul className="list-disc list-inside space-y-1">
                {result.consigli_finali.map((c, idx) => (
                  <li key={idx}>{c}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
