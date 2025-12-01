// lib/authClient.js

const AUTH_BASE = process.env.NEXT_PUBLIC_AUTH_BASE;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_REDIRECT_FALLBACK =
  process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URL || "";
// ===============================================================
// 🔗 Helper: calcola sempre l'URL di redirect corretto
// ===============================================================
function getSupabaseRedirectUrl() {
  // In browser: usiamo sempre l'origin reale + /reset-password
  if (typeof window !== "undefined") {
    return `${window.location.origin}/reset-password`;
  }

  // Fallback per build/SSR (prod)
  return "https://dyana.app/reset-password";
}


export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("d_token");
}

export function saveToken(token) {
  if (typeof window === "undefined") return;
  localStorage.setItem("d_token", token);
}

export function clearToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("d_token");
}

// ===============================================================
// 🔐 LOGIN DYANA → JWT RS256 da astrobot_auth_pub
// ===============================================================
export async function loginWithCredentials(email, password) {
  const form = new FormData();
  form.append("email", email);
  form.append("password", password);

  const res = await fetch(`${AUTH_BASE}/login`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) throw new Error("Credenziali non valide");
  const data = await res.json();
  saveToken(data.access_token);
  return data;
}

// ===============================================================
// 🆕 SIGNUP SUPABASE (email/password)
// ===============================================================
export async function registerWithEmail(email, password) {
  const redirectUrl = getSupabaseRedirectUrl();

  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      redirect_to: redirectUrl,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.msg || "Errore nella registrazione");
  return data;
}

// ===============================================================
// 🆓 GUEST TOKEN
// ===============================================================
export async function getGuestToken() {
  const res = await fetch(`${AUTH_BASE}/auth/anonymous`);
  const data = await res.json();
  saveToken(data.access_token);
  return data.access_token;
}

// ===============================================================
// 📧 RESET PASSWORD — invio email
// ===============================================================
export async function sendPasswordResetEmail(email) {
  const redirectUrl = getSupabaseRedirectUrl();
  console.log("[RESET] redirectUrl usato:", redirectUrl);

  // 👇 Costruiamo l'URL con redirect_to come query param
  const url = new URL(`${SUPABASE_URL}/auth/v1/recover`);
  url.searchParams.set("redirect_to", redirectUrl);

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email, // 👈 solo email nel body
      // niente redirect_to qui dentro
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[RESET] Errore recover:", res.status, text || "<nessun body>");
    let msg = "Errore nell'invio dell'email";
    try {
      const data = text ? JSON.parse(text) : null;
      if (data?.msg) msg = data.msg;
    } catch (e) {}
    throw new Error(msg);
  }

  return true;
}


// ===============================================================
// 🔐 RESET PASSWORD — cambio password (via token)
// ===============================================================
export async function updatePassword(accessToken, newPassword) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    method: "PUT",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password: newPassword }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.msg || "Errore aggiornamento password");
  return true;
}
