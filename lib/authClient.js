// ⚠️ lascia "use client" se era presente in cima (se non c'era, puoi ignorare)

import { createClient } from "@supabase/supabase-js";

// ============================
// DEBUG FLAG
// ============================
const DEBUG =
  typeof process !== "undefined" &&
  process?.env?.NEXT_PUBLIC_DEBUG &&
  String(process.env.NEXT_PUBLIC_DEBUG) !== "0" &&
  String(process.env.NEXT_PUBLIC_DEBUG).toLowerCase() !== "false";

function dlog(...args) {
  if (!DEBUG) return;
  // eslint-disable-next-line no-console
  console.log(...args);
}
function derr(...args) {
  // error li teniamo (ma puoi anche metterli dietro DEBUG se vuoi)
  // eslint-disable-next-line no-console
  console.error(...args);
}

// ============================
// CONFIG BASE URL
// ============================

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

dlog("[AUTH CONFIG] API_BASE =", API_BASE);
dlog("[AUTH CONFIG] AUTH_BASE =", AUTH_BASE);

if (typeof window !== "undefined" && DEBUG) {
  window.__AUTH_BASE = AUTH_BASE;
  window.__API_BASE = API_BASE;
  dlog("[AUTH CONFIG][window] AUTH_BASE =", window.__AUTH_BASE);
}

async function readTextSafe(res) {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

// ============================
// KEYS STORAGE
// ============================

const TOKEN_KEY = "dyana_jwt"; // token utente registrato (astrobot_access_token)
const GUEST_TOKEN_KEY = "diyana_guest_jwt"; // token guest (anonimo)

// ============================
// DEVICE ID (cookie)
// ============================

const DEVICE_COOKIE = "device_id";

function readCookie(name) {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

function writeCookie(name, value, maxAgeSeconds) {
  if (typeof document === "undefined") return;
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";
  document.cookie = `${name}=${encodeURIComponent(
    value
  )}; Max-Age=${maxAgeSeconds}; Path=/; SameSite=Lax${secure}`;
}

function uuidv4() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Source-of-truth per guest identity.
 * Deve essere stabile nel tempo (1 anno).
 */
export function getOrCreateDeviceId() {
  if (typeof window === "undefined") return null;
  const existing = readCookie(DEVICE_COOKIE);
  if (existing) return existing;

  const id = uuidv4();
  writeCookie(DEVICE_COOKIE, id, 60 * 60 * 24 * 365); // 1 anno
  return id;
}

function withDeviceHeader(headers = {}) {
  const deviceId = getOrCreateDeviceId();
  return {
    ...headers,
    ...(deviceId ? { "X-Device-Id": deviceId } : {}),
  };
}

// ============================
// SUPABASE (solo per reset password / fallback)
// ============================

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
    // il token user prende priorità, quindi pulisco guest
    localStorage.removeItem(GUEST_TOKEN_KEY);
  } catch (err) {
    derr("[AUTH] errore salvataggio token:", err);
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
    derr("[AUTH] errore clear token:", err);
  }
}

// --- Guest token -----------------------

export function getGuestToken() {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(GUEST_TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Ritorna un qualsiasi token valido per i crediti:
 * - prima il token utente registrato
 * - altrimenti il token guest (se presente)
 */
export function getAnyAuthToken() {
  const userToken = getToken();
  if (userToken) return userToken;
  return getGuestToken();
}

export function saveGuestToken(token) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GUEST_TOKEN_KEY, token);
  } catch (err) {
    derr("[AUTH] errore salvataggio guest token:", err);
  }
}

export function clearGuestToken() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(GUEST_TOKEN_KEY);
  } catch (err) {
    derr("[AUTH] errore clear guest token:", err);
  }
}

// ============================
// GUEST TOKEN: INIT / SINGLETON
// ============================

// Singleton per evitare più chiamate parallele a /auth/anonymous
let guestTokenPromise = null;

export async function ensureGuestToken() {
  if (typeof window === "undefined") return null;

  const existing = getGuestToken();
  if (existing) return existing;

  if (guestTokenPromise) return guestTokenPromise;

  if (!AUTH_BASE) {
    derr("[AUTH][GUEST] AUTH_BASE non configurato");
    return null;
  }

  const base = AUTH_BASE.replace(/\/+$/, "");
  const url = `${base}/auth/anonymous`;

  guestTokenPromise = (async () => {
    try {
      const deviceId = getOrCreateDeviceId();
      if (!deviceId) {
        derr("[AUTH][GUEST] deviceId non disponibile");
        return null;
      }

      dlog("[AUTH][GUEST] deviceId =", deviceId);

      const res = await fetch(url, {
        method: "GET",
        headers: {
          "X-Device-Id": deviceId,
        },
      });

      if (!res.ok) {
        const text = await readTextSafe(res);
        derr("[AUTH][GUEST] /auth/anonymous non OK:", res.status, text || "<nessun body>");
        return null;
      }

      const text = await readTextSafe(res);
      let data = null;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        derr("[AUTH][GUEST] risposta non JSON:", text);
        return null;
      }

      const token = data?.access_token || data?.token;
      if (!token) {
        derr("[AUTH][GUEST] token mancante nella risposta:", data);
        return null;
      }

      saveGuestToken(token);
      return token;
    } catch (err) {
      derr("[AUTH][GUEST] errore chiamando /auth/anonymous:", err);
      return null;
    } finally {
      guestTokenPromise = null;
    }
  })();

  return guestTokenPromise;
}

export async function getAnyAuthTokenAsync() {
  const userToken = getToken();
  if (userToken) return userToken;

  const guest = getGuestToken();
  if (guest) return guest;

  return ensureGuestToken();
}

// ============================
// LOGIN (password) / MAGIC LINK (auth_pub)
// ============================

export async function loginWithCredentials(email, password) {
  if (!AUTH_BASE) {
    derr("[loginWithCredentials] AUTH_BASE non configurato");
    throw new Error("Configurazione auth mancante.");
  }

  dlog("[loginWithCredentials] chiamata a", `${AUTH_BASE}/login`);

  const body = new URLSearchParams({ email, password }).toString();

  let res;
  let rawText;

  try {
    res = await fetch(`${AUTH_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  } catch (err) {
    derr("[loginWithCredentials] errore di rete/fetch", err);
    throw new Error("Impossibile contattare il server di login.");
  }

  rawText = await readTextSafe(res);

  let data = null;
  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      derr("[loginWithCredentials] JSON parse error", rawText);
      throw new Error("Risposta non valida dal server di login.");
    }
  } else {
    data = {};
  }

  if (!res.ok) {
    derr("[loginWithCredentials] status non OK", res.status, data);
    const msg = (data && (data.detail || data.message)) || "Email o password errati.";
    throw new Error(msg);
  }

  if (!data.access_token) {
    derr("[loginWithCredentials] risposta 200 ma senza access_token", data);
    throw new Error("Risposta inattesa dal server di login.");
  }

  saveToken(data.access_token);
  return data;
}

export async function sendMagicLink(email, redirect_to) {
  const e = (email || "").trim().toLowerCase();
  if (!e || !e.includes("@")) throw new Error("Inserisci un’email valida.");

  if (!AUTH_BASE) {
    throw new Error("AUTH_BASE non configurato (NEXT_PUBLIC_AUTH_BASE).");
  }

  const base = AUTH_BASE.replace(/\/+$/, "");
  const url = `${base}/auth/magic-link`;

  const payload = {
    email: e,
    create_user: true,
    redirect_to: redirect_to || undefined,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const txt = await readTextSafe(res);

    let msg = txt || `HTTP ${res.status}`;
    try {
      const j = txt ? JSON.parse(txt) : null;
      if (j?.detail) {
        if (typeof j.detail === "string") msg = j.detail;
        else msg = j.detail.msg || j.detail.message || JSON.stringify(j.detail);
      }
    } catch {}

    derr("[MAGICLINK][AUTH_PUB] error:", res.status, txt || "<no body>");
    throw new Error(msg || "Invio magic link fallito.");
  }

  const txt = await readTextSafe(res);
  try {
    return txt ? JSON.parse(txt) : { ok: true };
  } catch {
    return { ok: true, raw: txt };
  }
}

export async function verifyMagicLink(token_hash, type = "magiclink") {
  const th = (token_hash || "").trim();
  if (!th) throw new Error("Token hash mancante.");

  if (!AUTH_BASE) {
    throw new Error("AUTH_BASE non configurato (NEXT_PUBLIC_AUTH_BASE).");
  }

  const base = AUTH_BASE.replace(/\/+$/, "");
  const url = `${base}/auth/magic-link/verify`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token_hash: th, type: type || "magiclink" }),
  });

  if (!res.ok) {
    const txt = await readTextSafe(res);
    derr("[MAGICLINK][VERIFY][AUTH_PUB] error:", res.status, txt || "<no body>");
    throw new Error(txt || "Verifica magic link fallita.");
  }

  const txt = await readTextSafe(res);
  let data = null;
  try {
    data = txt ? JSON.parse(txt) : {};
  } catch {
    throw new Error("Risposta non valida dal server (JSON parse error).");
  }

  const astrobotToken = data?.astrobot_access_token;
  if (astrobotToken) {
    saveToken(astrobotToken);
  } else {
    // NON rompiamo il flusso, ma in debug è utile
    dlog("[MAGICLINK][VERIFY] risposta senza astrobot_access_token:", data);
  }

  return data;
}

// ============================
// ALIAS DYANA (compatibilità import)
// ============================
export async function sendAuthMagicLink(email, redirect_to) {
  return sendMagicLink(email, redirect_to);
}

export async function verifyAuthMagicLink(token_hash, type = "magiclink") {
  return verifyMagicLink(token_hash, type);
}

/**
 * VERSIONE SUPABASE (fallback / non rompe nulla).
 */
export async function sendMagicLinkSupabase(email) {
  const e = (email || "").trim().toLowerCase();
  if (!e || !e.includes("@")) throw new Error("Inserisci un’email valida.");

  if (!supabase) {
    throw new Error(
      "Magic link Supabase non configurato: manca NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  const emailRedirectTo =
    process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URL || "http://localhost:3000/";

  const { data, error } = await supabase.auth.signInWithOtp({
    email: e,
    options: { emailRedirectTo },
  });

  if (error) {
    derr("[MAGICLINK][SUPABASE] error:", error);
    throw new Error(error.message || "Invio magic link Supabase fallito.");
  }

  return data;
}

export async function registerWithEmail(email, password) {
  const e = (email || "").trim().toLowerCase();
  if (!e || !e.includes("@")) throw new Error("Inserisci un’email valida.");

  if (!supabase) {
    throw new Error(
      "Registrazione non configurata: manca NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  const emailRedirectTo =
    process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URL || "http://localhost:3000/reset-password";

  const { data, error } = await supabase.auth.signUp({
    email: e,
    password,
    options: { emailRedirectTo },
  });

  if (error) {
    derr("[REGISTER][SUPABASE] error:", error);
    throw new Error(error.message || "Registrazione fallita.");
  }

  return data;
}

export async function sendPasswordResetEmail(email) {
  if (!supabase) {
    derr("[RESET-PASS] Supabase non configurato (manca NEXT_PUBLIC_SUPABASE_URL o ANON_KEY).");
    throw new Error("Reset password non configurato. Contatta il supporto se il problema persiste.");
  }

  const redirectTo =
    process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URL || "http://localhost:3000/reset-password";

  dlog("[RESET-PASS] invio mail reset per", email, "redirectTo =", redirectTo);

  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  if (error) {
    derr("[RESET-PASS] errore Supabase:", error);
    throw new Error(error.message || "Errore durante l'invio dell'email di reset.");
  }

  return { ok: true };
}

// ============================
// CREDITS / USAGE (auth_pub)
// ============================

export async function fetchCreditsState(token) {
  if (!AUTH_BASE) {
    derr("[CREDITS/STATE] AUTH_BASE non definita (NEXT_PUBLIC_AUTH_BASE).");
    throw new Error("Configurazione auth mancante.");
  }

  const effectiveToken = token || getAnyAuthToken();

  if (!effectiveToken) {
    dlog("[CREDITS/STATE] nessun token disponibile (user/guest).");
    throw new Error("Nessun token disponibile per leggere i crediti.");
  }

  const url = `${AUTH_BASE}/credits/state`;
  dlog("[CREDITS/STATE] chiamata a:", url);

  const res = await fetch(url, {
    method: "GET",
    headers: withDeviceHeader({ Authorization: `Bearer ${effectiveToken}` }),
  });

  dlog("[fetchCreditsState] status", res.status);

  if (!res.ok) {
    const text = await readTextSafe(res);
    derr("[CREDITS/STATE] errore:", res.status, text || "<nessun body>");
    throw new Error("Errore nel recupero dei crediti.");
  }

  const text = await readTextSafe(res);
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Risposta non valida dal server (credits/state JSON parse error).");
  }
}

export async function fetchUsageHistory(token) {
  if (!AUTH_BASE) {
    derr("[USAGE/HISTORY] AUTH_BASE non definita.");
    throw new Error("Configurazione auth mancante.");
  }

  const effectiveToken = token || getAnyAuthToken();
  if (!effectiveToken) {
    throw new Error("Nessun token disponibile per la cronologia.");
  }

  const url = `${AUTH_BASE}/usage/history`;
  dlog("[USAGE/HISTORY] chiamata a:", url);

  const res = await fetch(url, {
    method: "GET",
    headers: withDeviceHeader({ Authorization: `Bearer ${effectiveToken}` }),
  });

  if (!res.ok) {
    const text = await readTextSafe(res);
    derr("[USAGE/HISTORY] errore:", res.status, text || "<nessun body>");
    throw new Error("Errore nel recupero della cronologia.");
  }

  const text = await readTextSafe(res);
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Risposta non valida dal server (usage/history JSON parse error).");
  }
}

// ============================
// PRIVACY / MARKETING CONSENT
// ============================

export async function updateMarketingConsent(token, value) {
  if (!AUTH_BASE) {
    derr("[PRIVACY] AUTH_BASE non definita.");
    throw new Error("Configurazione auth mancante.");
  }

  const effectiveToken = token || getAnyAuthToken();
  if (!effectiveToken) {
    throw new Error("Nessun token disponibile per aggiornare la privacy.");
  }

  const url = `${AUTH_BASE}/user/privacy`;
  dlog("[PRIVACY] chiamata a:", url, "valore:", value);

  const resp = await fetch(url, {
    method: "PATCH",
    headers: withDeviceHeader({
      Authorization: `Bearer ${effectiveToken}`,
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({ marketing_consent: value }),
  });

  if (!resp.ok) {
    const text = await readTextSafe(resp);
    derr("[PRIVACY] errore updateMarketingConsent:", resp.status, text || "<nessun body>");
    throw new Error("Errore aggiornamento privacy");
  }

  const text = await readTextSafe(resp);
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

// ============================
// CANCELLAZIONE PROFILO
// ============================

export async function deleteProfile(token) {
  if (!AUTH_BASE) {
    derr("[DELETE/PROFILE] AUTH_BASE non definita.");
    throw new Error("Configurazione auth mancante.");
  }

  const effectiveToken = token || getAnyAuthToken();
  if (!effectiveToken) {
    throw new Error("Nessun token disponibile per cancellare il profilo.");
  }

  const url = `${AUTH_BASE}/user/delete`;
  dlog("[DELETE/PROFILE] chiamata a:", url);

  const resp = await fetch(url, {
    method: "DELETE",
    headers: withDeviceHeader({ Authorization: `Bearer ${effectiveToken}` }),
  });

  if (!resp.ok) {
    const text = await readTextSafe(resp);
    derr("[DELETE/PROFILE] errore:", resp.status, text || "<nessun body>");
    throw new Error("Errore cancellazione profilo");
  }

  const text = await readTextSafe(resp);
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

// ============================
// COOKIE CONSENT (guest)
// ============================

export async function updateCookieConsent(token) {
  if (!AUTH_BASE) {
    derr("[COOKIE] AUTH_BASE non definita.");
    throw new Error("Configurazione auth mancante.");
  }

  const effectiveToken = token || getAnyAuthToken();
  if (!effectiveToken) {
    throw new Error("Nessun token disponibile per i cookie.");
  }

  const url = `${AUTH_BASE}/cookie/accept`;
  dlog("[COOKIE] chiamata a:", url);

  const resp = await fetch(url, {
    method: "POST",
    headers: withDeviceHeader({ Authorization: `Bearer ${effectiveToken}` }),
  });

  if (!resp.ok) {
    const text = await readTextSafe(resp);
    derr("[COOKIE] errore updateCookieConsent:", resp.status, text || "<nessun body>");
    throw new Error("Errore aggiornamento cookie consent");
  }

  const text = await readTextSafe(resp);
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

// ============================
// RESUME (post login)
// ============================

export function setResumeTarget({ path, readingId }) {
  try {
    localStorage.setItem("dyana_resume_path", path);
    localStorage.setItem("dyana_resume_qs", `resume=${encodeURIComponent(readingId)}&from=welcome`);
    localStorage.setItem("dyana_resume_ts", String(Date.now()));
  } catch {}
}

/// HELPER MAGIC
export async function exchangeSupabaseTokenForDyanaJwt(supabaseAccessToken) {
  const t = (supabaseAccessToken || "").trim();
  if (!t) throw new Error("Supabase access token mancante.");

  if (!AUTH_BASE) {
    throw new Error("AUTH_BASE non configurato (NEXT_PUBLIC_AUTH_BASE).");
  }

  const url = `${AUTH_BASE.replace(/\/+$/, "")}/auth/exchange`;

  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${t}` },
  });

  const txt = await readTextSafe(res);

  if (!res.ok) {
    derr("[AUTH][EXCHANGE] error:", res.status, txt || "<no body>");
    throw new Error(txt || "Exchange fallito.");
  }

  let data = {};
  try {
    data = txt ? JSON.parse(txt) : {};
  } catch {
    throw new Error("Risposta non valida dal server (exchange JSON parse error).");
  }

  if (!data?.astrobot_access_token) {
    throw new Error("Exchange OK ma manca astrobot_access_token.");
  }

  saveToken(data.astrobot_access_token);
  return data;
}
