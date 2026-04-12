"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { useI18n } from "../../../lib/i18n/useI18n";

import {
  verifyMagicLink,
  exchangeSupabaseTokenForDyanaJwt,
  clearToken,
  getResumeTarget,
  clearResumeTarget,
} from "../../../lib/authClient";

const WELCOME_PATH = "/welcome";
const AUTH_DONE_KEY = "dyana_auth_done";

const DEBUG =
  typeof process !== "undefined" &&
  process?.env?.NEXT_PUBLIC_DEBUG &&
  String(process.env.NEXT_PUBLIC_DEBUG) !== "0" &&
  String(process.env.NEXT_PUBLIC_DEBUG).toLowerCase() !== "false";

function dlog(...args) {
  if (!DEBUG) return;
  console.log(...args);
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error("Config mancante: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return createClient(url, anon);
}

function notifyAuthDone() {
  try {
    localStorage.setItem(AUTH_DONE_KEY, String(Date.now()));
  } catch {}

  try {
    window.dispatchEvent(
      new CustomEvent("dyana:auth", { detail: { type: "AUTH_DONE", ts: Date.now() } })
    );
  } catch {}

  try {
    const bc = new BroadcastChannel("dyana_auth");
    bc.postMessage({ type: "AUTH_DONE", ts: Date.now() });
    bc.close();
  } catch {}
}

function resolveWelcomeMode(typeQ) {
  if (typeQ === "signup" || typeQ === "invite") return "new";
  return "back";
}

function resolvePostLoginDestination(typeQ) {
  const resume = getResumeTarget();

  if (resume?.path) {
    const full = `${resume.path}${resume.qs ? `?${resume.qs}` : ""}`;
    clearResumeTarget();
    return full;
  }

  const mode = resolveWelcomeMode(typeQ);
  return `${WELCOME_PATH}?mode=${mode}`;
}

export default function CallbackClient() {
  const { t } = useI18n();

  const router = useRouter();
  const sp = useSearchParams();

  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [debugUrl, setDebugUrl] = useState("");

  useEffect(() => {
    async function run() {
      try {
        dlog("[CALLBACK] URL:", window.location.href);

        // 0) PKCE FLOW (?code=...)
        const code = sp?.get("code");
        if (code) {
          const supabase = getSupabase();

          const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exErr) throw exErr;

          notifyAuthDone();

          const typeQ0 = sp?.get("type") || "magiclink";
          const nextUrl = resolvePostLoginDestination(typeQ0);

          router.replace(nextUrl);
          return;
        }

        // 1) FLOW token_hash (auth_pub)
        const tokenHash = sp?.get("token_hash");
        const typeQ = sp?.get("type") || "magiclink";

        if (tokenHash) {
          await verifyMagicLink(tokenHash, typeQ);
          notifyAuthDone();

          const nextUrl = resolvePostLoginDestination(typeQ);

          router.replace(nextUrl);
          return;
        }

        // 2) FALLBACK (hash access_token)
        const hash = typeof window !== "undefined" ? window.location.hash : "";
        const hp = new URLSearchParams((hash || "").replace("#", ""));
        const sbAccessToken = hp.get("access_token");
        const typeHash = hp.get("type") || "magiclink";

        if (sbAccessToken) {
          await exchangeSupabaseTokenForDyanaJwt(sbAccessToken);
          notifyAuthDone();

          const nextUrl = resolvePostLoginDestination(typeHash);

          router.replace(nextUrl);
          return;
        }

        throw new Error(t("auth.callback.errorMissingToken"));
      } catch (e) {
        try {
          clearToken();
        } catch {}
        setStatus("error");
        setError(e?.message || t("auth.callback.errorGeneric"));
      }
    }

    try {
      setDebugUrl(window.location.href);
    } catch {}

    run();
  }, [router, sp, t]);

  if (status === "error") {
    return (
      <div className="card">
        <h1 className="card-title">{t("auth.callback.errorTitle")}</h1>
        <p className="card-text" style={{ color: "#ff9a9a" }}>
          {error}
        </p>

        {DEBUG ? (
          <p
            className="card-text"
            style={{ opacity: 0.7, fontSize: "0.75rem", wordBreak: "break-all" }}
          >
            {debugUrl}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="card">
      <h1 className="card-title">
        {t("auth.callback.loadingTitle")}
      </h1>
      <p className="card-text" style={{ opacity: 0.85 }}>
        {t("auth.callback.loadingSubtitle")}
      </p>

      {DEBUG ? (
        <p
          className="card-text"
          style={{ opacity: 0.7, fontSize: "0.75rem", wordBreak: "break-all" }}
        >
          {debugUrl}
        </p>
      ) : null}
    </div>
  );
}