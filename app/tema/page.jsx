"use client";

import { useState } from "react";

type Tier = "free" | "premium";

interface TemaAiResult {
  profilo_generale?: string;
  psicologia_profonda?: string;
  amore_relazioni?: string;
  lavoro_carriera?: string;
  fortuna_crescita?: string;
  talenti?: string;
  sfide?: string;
  consigli?: string;
}

export default function TemaNataleAiPage() {
  const [nome, setNome] = useState("");
  const [citta, setCitta] = useState("");
  const [data, setData] = useState(""); // YYYY-MM-DD
  const [ora, setOra] = useState("");   // HH:MM
  const [tier, setTier] = useState<Tier>("free");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TemaAiResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const resp = await fetch("/api/tema-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          citta,
          data,
          ora,
          nome: nome || null,
          tier,
        }),
      });

      const dataJson = await resp.json();

      if (!resp.ok || dataJson.status !== "ok" || !dataJson.result) {
        setError(dataJson.message || "Si è verificato un errore inatteso.");
        return;
      }

      setResult(dataJson.result as TemaAiResult);
    } catch (err: any) {
      setError("Non riesco a contattare il server. Riprova tra qualche minuto.");
    } finally {
      setLoading(false);
    }
  }

  const isFree = tier === "free";

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-4xl flex-col gap-10 px-4 py-20 md:px-6 lg:px-8">
        {/* Header sezione */}
        <header className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-sky-300/80">
            DYANA · AstroBot
          </p>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Tema natale <span className="text-sky-300">AI</span>
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-slate-300 md:text-base">
            Inserisci i tuoi dati di nascita: l’intelligenza artificiale di DYANA
            interpreta il tuo cielo di nascita e ti restituisce un profilo
            personale, da anteprima <span className="text-sky-300">Free</span> a
            lettura <span className="text-sky-300">Premium completa</span>.
          </p>
        </header>

        {/* Card principale */}
        <div className="grid gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          {/* Form */}
          <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl shadow-slate-950/40 backdrop-blur md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-lg font-medium text-slate-50">
                  I tuoi dati di nascita
                </h2>
                <p className="text-xs text-slate-400">
                  Usa orari il più precisi possibile: migliorano la qualità
                  dell’interpretazione dell’ascendente e delle case.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-medium uppercase tracking-wide text-slate-300">
                    Nome <span className="font-normal lowercase text-slate-500">(facoltativo)</span>
                  </label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Es. Mario"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none ring-0 transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/40"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium uppercase tracking-wide text-slate-300">
                    Città di nascita
                  </label>
                  <input
                    type="text"
                    value={citta}
                    onChange={(e) => setCitta(e.target.value)}
                    placeholder="Es. Napoli"
                    required
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none ring-0 transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/40"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-xs font-medium uppercase tracking-wide text-slate-300">
                      Data di nascita
                    </label>
                    <input
                      type="date"
                      value={data}
                      onChange={(e) => setData(e.target.value)}
                      required
                      className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none ring-0 transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/40"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-medium uppercase tracking-wide text-slate-300">
                      Ora di nascita
                    </label>
                    <input
                      type="time"
                      value={ora}
                      onChange={(e) => setOra(e.target.value)}
                      required
                      className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none ring-0 transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/40"
                    />
                  </div>
                </div>

                <fieldset className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/40 px-3 py-3">
                  <legend className="px-1 text-xs font-medium uppercase tracking-wide text-slate-300">
                    Versione del tema
                  </legend>
                  <div className="flex flex-col gap-2 text-sm text-slate-200">
                    <label className="flex cursor-pointer items-start gap-2 rounded-2xl px-2 py-1.5 transition hover:bg-slate-900/80">
                      <input
                        type="radio"
                        name="tier"
                        value="free"
                        checked={tier === "free"}
                        onChange={() => setTier("free")}
                        className="mt-0.5 h-4 w-4 cursor-pointer accent-sky-400"
                      />
                      <span>
                        <span className="font-medium">Free</span>{" "}
                        <span className="text-xs text-slate-400">
                          – Profilo introduttivo + invito a sbloccare il resto.
                        </span>
                      </span>
                    </label>

                    <label className="flex cursor-pointer items-start gap-2 rounded-2xl px-2 py-1.5 transition hover:bg-slate-900/80">
                      <input
                        type="radio"
                        name="tier"
                        value="premium"
                        checked={tier === "premium"}
                        onChange={() => setTier("premium")}
                        className="mt-0.5 h-4 w-4 cursor-pointer accent-sky-400"
                      />
                      <span>
                        <span className="font-medium">Premium</span>{" "}
                        <span className="text-xs text-slate-400">
                          – Lettura completa: psicologia, amore, lavoro, fortuna, talenti, sfide, consigli.
                        </span>
                      </span>
                    </label>
                  </div>
                </fieldset>
              </div>

              <div className="flex items-center justify-between gap-3">
                <p className="text-[0.7rem] text-slate-500">
                  I dati vengono usati solo per calcolare il tema natale.
                </p>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center rounded-2xl bg-sky-400 px-4 py-2 text-sm font-medium text-slate-950 shadow-lg shadow-sky-500/40 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Sto interpretando…" : "Calcola il tuo tema natale"}
                </button>
              </div>

              {error && (
                <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                  ⚠️ {error}
                </div>
              )}

              {loading && !error && (
                <div className="text-xs text-slate-400">
                  I pianeti stanno prendendo parola… ✨
                </div>
              )}
            </form>
          </section>

          {/* Risultato */}
          <section className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/40 p-5 shadow-inner shadow-slate-950/40 backdrop-blur md:p-7">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-300">
                Interpretazione
              </h2>
              <p className="text-xs text-slate-400">
                Qui comparirà il testo generato dall’AI a partire dal tuo tema
                natale.
              </p>
            </div>

            {!result && !loading && !error && (
              <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-700/80 bg-slate-950/40 p-6 text-center text-xs text-slate-500">
                Compila i dati e avvia il calcolo per leggere il tuo profilo
                astrologico personalizzato.
              </div>
            )}

            {result && (
              <div className="space-y-5 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm leading-relaxed text-slate-100">
                {isFree ? (
                  <>
                    {result.profilo_generale && (
                      <div className="space-y-2">
                        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">
                          Profilo generale
                        </h3>
                        <p className="text-sm text-slate-100">
                          {result.profilo_generale}
                        </p>
                      </div>
                    )}

                    <div className="mt-4 space-y-2 rounded-2xl border border-sky-500/40 bg-sky-500/10 px-3 py-3 text-sm">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">
                        Sblocca la versione Premium
                      </p>
                      <p className="text-sm text-slate-100">
                        Questa è solo un&apos;anteprima del tuo tema natale. Con la
                        versione <span className="font-semibold text-sky-300">Premium</span>{" "}
                        puoi sbloccare sezioni complete su Amore, Lavoro, Fortuna,
                        Talenti, Sfide e Consigli pratici per te.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    {result.profilo_generale && (
                      <SectionBlock
                        title="Profilo generale"
                        text={result.profilo_generale}
                      />
                    )}
                    {result.psicologia_profonda && (
                      <SectionBlock
                        title="Psicologia profonda"
                        text={result.psicologia_profonda}
                      />
                    )}
                    {result.amore_relazioni && (
                      <SectionBlock
                        title="Amore e relazioni"
                        text={result.amore_relazioni}
                      />
                    )}
                    {result.lavoro_carriera && (
                      <SectionBlock
                        title="Lavoro e carriera"
                        text={result.lavoro_carriera}
                      />
                    )}
                    {result.fortuna_crescita && (
                      <SectionBlock
                        title="Fortuna e crescita"
                        text={result.fortuna_crescita}
                      />
                    )}
                    {result.talenti && (
                      <SectionBlock title="Talenti" text={result.talenti} />
                    )}
                    {result.sfide && (
                      <SectionBlock title="Sfide" text={result.sfide} />
                    )}
                    {result.consigli && (
                      <SectionBlock title="Consigli" text={result.consigli} />
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function SectionBlock({ title, text }: { title: string; text?: string }) {
  if (!text) return null;
  return (
    <article className="space-y-1 rounded-2xl border border-slate-800/80 bg-slate-900/60 px-3 py-3">
      <h3 className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-sky-300">
        {title}
      </h3>
      <p className="text-sm text-slate-100">{text}</p>
    </article>
  );
}
