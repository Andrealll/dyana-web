// lib/authClient.js

// ============================
// CONFIG BASE URL
// ============================

// Backend calcoli (chatbot-test)
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8001";

// Backend auth/crediti (astrobot_auth_pub)
const AUTH_BASE =
  process.env.NEXT_PUBLIC_AUTH_BASE || "http://127.0.0.1:8003";

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
    throw new Error("AUTH_BASE non configurato (NEXT_PUBLIC_AUTH_BASE).");
  }

  const body = new URLSearchParams();
  body.set("email", email);
  body.set("password", password);

  const res = await fetch(`${AUTH_BASE}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!res.ok) {
    const txt = await res.text();
    console.error("[LOGIN] errore:", res.status, txt || "<nessun body>");
    throw new Error("Login fallito.");
  }

  const data = await res.json();
  if (data?.access_token) {
    saveToken(data.access_token);
  }
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
