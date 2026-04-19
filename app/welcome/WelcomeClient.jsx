"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "../../lib/i18n/useI18n";
import { fetchCreditsState, getAnyAuthTokenAsync } from "../../lib/authClient";

export default function WelcomeClient() {
  const { t } = useI18n();

  const router = useRouter();
  const sp = useSearchParams();

  const mode = sp?.get("mode") || "back";
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [credits, setCredits] = useState(null);

  function buildResumeUrl(fallback = "/") {
    try {
      let path = localStorage.getItem("dyana_resume_path") || "";
      let qs = localStorage.getItem("dyana_resume_qs") || "";

      path = (path || "").trim();
      qs = (qs || "").trim();

      if (!path) return fallback;
      if (!path.startsWith("/")) path = `/${path}`;

      if (!qs) return path;

      return qs.startsWith("?") ? `${path}${qs}` : `${path}?${qs}`;
    } catch {
      return fallback;
    }
  }

  function clearResume() {
    try {
      localStorage.removeItem("dyana_resume_path");
      localStorage.removeItem("dyana_resume_qs");
      localStorage.removeItem("dyana_resume_ts");
    } catch {}
  }

  function notifyAuthDone() {
    const payload = { type: "AUTH_DONE", ts: Date.now() };

    try {
      localStorage.setItem("dyana_auth_done", String(payload.ts));
    } catch {}

    try {
      window.dispatchEvent(
        new CustomEvent("dyana:auth", { detail: payload })
      );
    } catch {}

    try {
      const bc = new BroadcastChannel("dyana_auth");
      bc.postMessage(payload);
      bc.close();
    } catch {}
  }

  function continueToResume() {
    notifyAuthDone();
    const target = buildResumeUrl("/");
    router.replace(target);
  }

  useEffect(() => {
    async function load() {
      try {
        const token = await getAnyAuthTokenAsync?.();
        if (!token) {
          setStatus("error");
          setError(t("auth.welcome.errorSessionMissing"));
          return;
        }

        try {
          const st = await fetchCreditsState(token);
          if (typeof st?.remaining_credits === "number") {
            setCredits(st.remaining_credits);
          } else if (typeof st?.credits === "number") {
            setCredits(st.credits);
          }
        } catch {}

        if (mode === "back") {
          continueToResume();
          return;
        }

        setStatus("ok");
      } catch (e) {
        setStatus("error");
        setError(e?.message || t("auth.welcome.errorGeneric"));
      }
    }

    load();
  }, [t, mode, router]);

  if (status === "loading") {
    return (
      <div className="card">
        <h1 className="card-title">
          {t("auth.welcome.loadingTitle")}
        </h1>
        <p className="card-text" style={{ opacity: 0.85 }}>
          {t("auth.welcome.loadingSubtitle")}
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="card">
        <h1 className="card-title">
          {t("auth.welcome.errorTitle")}
        </h1>
        <p className="card-text" style={{ color: "#ff9a9a" }}>
          {error}
        </p>
        <button
          className="btn btn-primary"
          style={{ marginTop: 16 }}
          onClick={() => router.push("/login")}
        >
          {t("auth.welcome.ctaLogin")}
        </button>
      </div>
    );
  }

  const title =
    mode === "new"
      ? t("auth.welcome.titleNew")
      : t("auth.welcome.titleBack");

  return (
    <div className="card">
      <h1 className="card-title">{title}</h1>

      {mode === "new" ? (
        <>
          <p className="card-text" style={{ opacity: 0.9 }}>
            {t("auth.welcome.newLine1")}
          </p>
          <p className="card-text" style={{ opacity: 0.9 }}>
            {t("auth.welcome.newLine2")}
          </p>
        </>
      ) : (
        <>
          <p className="card-text" style={{ opacity: 0.9 }}>
            {t("auth.welcome.backLine1")}
          </p>
          <p className="card-text" style={{ opacity: 0.9 }}>
            {t("auth.welcome.backLine2")}
          </p>
        </>
      )}

      <p className="card-text" style={{ marginTop: 10 }}>
        {t("common.availableCredits")}{" "}
        <strong>{credits ?? "—"}</strong>
      </p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
        {mode === "back" && (
          <button
            className="btn btn-primary"
            onClick={continueToResume}
          >
            {t("auth.welcome.ctaContinue")}
          </button>
        )}

        <button
          className={mode === "back" ? "btn" : "btn btn-primary"}
          onClick={() => {
            clearResume();
            router.push("/");
          }}
        >
          {t("auth.welcome.ctaHome")}
        </button>
      </div>
    </div>
  );
}