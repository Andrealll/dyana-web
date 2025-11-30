// lib/authClient.js

const AUTH_BASE = process.env.NEXT_PUBLIC_AUTH_BASE;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_REDIRECT_URL = process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URL;

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
// 🔐 LOGIN SUPABASE → JWT RS256 DA astrobot_auth_pub
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
// 🆕 SIGNUP SUPABASE
// ===============================================================
export async function registerWithEmail(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      redirect_to: SUPABASE_REDIRECT_URL,
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
  const res = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      redirect_to: SUPABASE_REDIRECT_URL,
    }),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data?.msg || "Errore nell'invio dell'email");
  }

  return true;
}

// ===============================================================
// 🔐 RESET PASSWORD — cambio password
// ===============================================================
export async function updatePassword(accessToken, newPassword) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    method: "PUT",
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password: newPassword }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.msg || "Errore aggiornamento password");
  return true;
}
