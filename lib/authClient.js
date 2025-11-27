// lib/authClient.js

// URL base del servizio di auth pubblico (astrobot_auth_pub)
const AUTH_BASE =
  process.env.NEXT_PUBLIC_AUTH_BASE ||
  process.env.NEXT_PUBLIC_AUTH_BASE_URL ||
  "http://127.0.0.1:8002"; // fallback locale

const TOKEN_KEY = "astrobot_jwt";

export function saveToken(token) {
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(TOKEN_KEY, token);
      // cookie semplice (NON httpOnly) giusto per il frontend
      document.cookie = `astrobot_jwt=${token}; path=/; max-age=${
        60 * 60 * 24 * 7
      }`;
    }
  } catch (err) {
    console.error("[DYANA] Errore salvataggio token:", err);
  }
}

export function getToken() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function clearToken() {
  try {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(TOKEN_KEY);
      document.cookie = "astrobot_jwt=; path=/; max-age=0; SameSite=Lax";
    }
  } catch (err) {
    console.error("[DYANA] Errore clear token:", err);
  }
}

/**
 * Login verso astrobot_auth_pub
 *
 * /login accetta:
 * - Content-Type: application/x-www-form-urlencoded
 * - campi: username, password
 *
 * Nel tuo app.py:
 *   if username != "demo" or password != "demo": 401
 *   ruolo = "free"
 */
export async function loginWithCredentials(username, password) {
  const url = `${AUTH_BASE}/login`;

  const body = new URLSearchParams();
  body.append("username", username);
  body.append("password", password);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      // IMPORTANTE: form-urlencoded, NON JSON
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!res.ok) {
    let text;
    try {
      text = await res.text();
    } catch {
      text = "";
    }
    throw new Error(
      `Login fallito (${res.status}): ${text || "Credenziali non valide"}`
    );
  }

  // La tua app.py ritorna un JSON con access_token / token_type / expires_in
  const data = await res.json();

  if (!data.access_token) {
    throw new Error("Token JWT mancante nella risposta di /login");
  }

  saveToken(data.access_token);
  return data;
}
