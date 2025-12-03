// lib/authClient.js

// ============================
// CONFIG BASE URL
// ============================

// lib/authClient.js
// ⚠️ lascia "use client" se è presente in cima al file

function resolveBase(envValue, port) {
  // 1) Se è definita una ENV (es. NEXT_PUBLIC_AUTH_BASE), usiamo SEMPRE quella
  if (envValue) {
    return envValue;
  }

  // 2) SSR: niente window → fallback localhost:port
  if (typeof window === "undefined") {
    return `http://127.0.0.1:${port}`;
  }

  const host = window.location.hostname;

  // 3) Sviluppo da PC (localhost / 127.0.0.1): host:port
  if (host === "localhost" || host === "127.0.0.1") {
    return `http://${host}:${port}`;
  }

  // 4) Sviluppo da cellulare / altro device in LAN:
  //    uso l'IP della macchina (es. 192.168.x.x):port
  return `http://${host}:${port}`;
}

const API_BASE = resolveBase(process.env.NEXT_PUBLIC_API_BASE, 8001);
const AUTH_BASE = resolveBase(process.env.NEXT_PUBLIC_AUTH_BASE, 8003);


console.log("[AUTH CONFIG] API_BASE =", API_BASE);
console.log("[AUTH CONFIG] AUTH_BASE =", AUTH_BASE);

const TOKEN_KEY = "dyana_jwt";

// ============================
// SUPABASE (per reset password)
// ============================

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

// ============================
// GESTIONE TOKEN
// ============================

export function saveToken(token) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (err) {
    console.error("[AUTH] errore salvataggio token:", err);
  }
}

export function getToken() {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function clearToken() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (err) {
    console.error("[AUTH] errore clear token:", err);
  }
}

// ============================
// LOGIN / REGISTRAZIONE
// ============================
export async function loginWithCredentials(email, password) {
  if (!AUTH_BASE) {
    console.error("[loginWithCredentials] AUTH_BASE non configurato");
    throw new Error("Configurazione auth mancante.");
  }

  console.log("[loginWithCredentials] chiamata a", `${AUTH_BASE}/login`);

  const body = new URLSearchParams({
    email,
    password,
  }).toString();

  let res;
  let rawText;

  try {
    res = await fetch(`${AUTH_BASE}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
  } catch (err) {
    console.error("[loginWithCredentials] errore di rete/fetch", err);
    throw new Error("Impossibile contattare il server di login.");
  }

  try {
    rawText = await res.text();
  } catch (err) {
    console.error("[loginWithCredentials] errore leggendo la risposta", err);
    throw new Error("Errore nella risposta del server di login.");
  }

  let data = null;
  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch (err) {
      console.error("[loginWithCredentials] JSON parse error", rawText);
      throw new Error("Risposta non valida dal server di login.");
    }
  } else {
    data = {};
  }

  // 🔴 Se NON è 2xx → trattiamo come errore credenziali (o messaggio backend)
  if (!res.ok) {
    console.error(
      "[loginWithCredentials] status non OK",
      res.status,
      data
    );
    const msg =
      (data && (data.detail || data.message)) ||
      "Email o password errati.";
    throw new Error(msg);
  }

  // ✅ Se è 200 ma manca access_token → è un errore di protocollo, NON di credenziali
  if (!data.access_token) {
    console.error(
      "[loginWithCredentials] risposta 200 ma senza access_token",
      data
    );
    throw new Error("Risposta inattesa dal server di login.");
  }

  // Salva il token e ritorna i dati
  saveToken(data.access_token);
  return data;
}


export async function registerWithEmail(email, password) {
  if (!AUTH_BASE) {
    throw new Error("AUTH_BASE non configurato (NEXT_PUBLIC_AUTH_BASE).");
  }

  const payload = { email, password };

  const res = await fetch(`${AUTH_BASE}/register/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const txt = await res.text();
    console.error("[REGISTER] errore:", res.status, txt || "<nessun body>");
    throw new Error(txt || "Registrazione fallita.");
  }

  return res.json();
}

// ============================
// RESET PASSWORD – INVIO MAIL
// ============================

export async function sendPasswordResetEmail(email) {
  if (!supabase) {
    console.error(
      "[RESET-PASS] Supabase non configurato (manca NEXT_PUBLIC_SUPABASE_URL o ANON_KEY)."
    );
    throw new Error(
      "Reset password non configurato. Contatta il supporto se il problema persiste."
    );
  }

  const redirectTo =
    process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URL ||
    "http://localhost:3000/reset-password";

  console.log(
    "[RESET-PASS] invio mail reset per",
    email,
    "redirectTo =",
    redirectTo
  );

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    console.error("[RESET-PASS] errore Supabase:", error);
    throw new Error(
      error.message || "Errore durante l'invio dell'email di reset."
    );
  }

  return { ok: true };
}

// ============================
// CREDITS / USAGE (auth_pub)
// ============================

export async function fetchCreditsState(token) {
  if (!AUTH_BASE) {
    console.error(
      "[CREDITS/STATE] AUTH_BASE non definita (NEXT_PUBLIC_AUTH_BASE)."
    );
    throw new Error("Configurazione auth mancante.");
  }

  const url = `${AUTH_BASE}/credits/state`;
  console.log("[CREDITS/STATE] chiamata a:", url);

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(
      "[CREDITS/STATE] errore:",
      res.status,
      text || "<nessun body>"
    );
    throw new Error("Errore nel recupero dei crediti.");
  }

  return res.json();
}

export async function fetchUsageHistory(token) {
  if (!AUTH_BASE) {
    console.error("[USAGE/HISTORY] AUTH_BASE non definita.");
    throw new Error("Configurazione auth mancante.");
  }

  const url = `${AUTH_BASE}/usage/history`;
  console.log("[USAGE/HISTORY] chiamata a:", url);

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(
      "[USAGE/HISTORY] errore:",
      res.status,
      text || "<nessun body>"
    );
    throw new Error("Errore nel recupero della cronologia.");
  }

  return res.json();
}

// ============================
// PRIVACY / MARKETING CONSENT
// ============================

export async function updateMarketingConsent(token, value) {
  if (!AUTH_BASE) {
    console.error("[PRIVACY] AUTH_BASE non definita.");
    throw new Error("Configurazione auth mancante.");
  }

  const url = `${AUTH_BASE}/user/privacy`;
  console.log("[PRIVACY] chiamata a:", url, "valore:", value);

  const resp = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ marketing_consent: value }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    console.error(
      "[PRIVACY] errore updateMarketingConsent:",
      resp.status,
      text || "<nessun body>"
    );
    throw new Error("Errore aggiornamento privacy");
  }

  return resp.json();
}

// ============================
// CANCELLAZIONE PROFILO
// ============================

export async function deleteProfile(token) {
  if (!AUTH_BASE) {
    console.error("[DELETE/PROFILE] AUTH_BASE non definita.");
    throw new Error("Configurazione auth mancante.");
  }

  const url = `${AUTH_BASE}/user/delete`;
  console.log("[DELETE/PROFILE] chiamata a:", url);

  const resp = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!resp.ok) {
    const text = await resp.text();
    console.error(
      "[DELETE/PROFILE] errore:",
      resp.status,
      text || "<nessun body>"
    );
    throw new Error("Errore cancellazione profilo");
  }

  return resp.json();
}


// ============================
// COOKIE CONSENT (guest)
// ============================

export async function updateCookieConsent(token) {
  if (!AUTH_BASE) {
    console.error("[COOKIE] AUTH_BASE non definita.");
    throw new Error("Configurazione auth mancante.");
  }

  const url = `${AUTH_BASE}/cookie/accept`;
  console.log("[COOKIE] chiamata a:", url);

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!resp.ok) {
    const text = await resp.text();
    console.error(
      "[COOKIE] errore updateCookieConsent:",
      resp.status,
      text || "<nessun body>",
    );
    throw new Error("Errore aggiornamento cookie consent");
  }

  return resp.json();
}
