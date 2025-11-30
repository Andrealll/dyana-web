// lib/apiClient.js

import { getToken, getGuestToken } from "./authClient";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

async function ensureToken() {
  let t = getToken();
  if (!t) t = await getGuestToken();
  return t;
}

export async function apiPost(path, body) {
  const token = await ensureToken();

  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-Engine": "ai",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
