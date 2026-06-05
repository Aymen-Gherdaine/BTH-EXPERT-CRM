"use client";

import { useState, useEffect, useId } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

const FONT = `var(--font-inter)`;
const CSS  = `*, *::before, *::after { box-sizing: border-box; } button { cursor: pointer; -webkit-tap-highlight-color: transparent; }`;

/* ── Breakpoint ─────────────────────────────────────────── */
function useBp(): "mobile" | "desktop" {
  const [bp, set] = useState<"mobile" | "desktop">("mobile");
  useEffect(() => {
    const h = () => set(window.innerWidth >= 768 ? "desktop" : "mobile");
    h();
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return bp;
}

/* ── Icons ──────────────────────────────────────────────── */
function Ic({ d, z = 20, s = "currentColor", f = "none", w = 1.7 }: {
  d: string | string[]; z?: number; s?: string; f?: string; w?: number;
}) {
  return (
    <svg width={z} height={z} viewBox="0 0 24 24" fill={f} stroke={s}
      strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
    </svg>
  );
}

const I = {
  leaf:    ["M2 22 16 8", "M22 2s-5.67 0-11 5c-4.17 4.17-4.83 9.33-3 11 1.83 1.67 7-1.17 11-5 5-5.33 5-11 5-11z"] as string[],
  eye:     ["M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8", "M12 12m-3 0a3 3 0 1 0 6 0 3 3 0 0 0-6 0"] as string[],
  eyeOff:  ["M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94", "M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19", "M1 1l22 22", "M10.73 10.73A3 3 0 0 0 12 15a3 3 0 0 0 2.27-4.27"] as string[],
  lock:    ["M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z", "M7 11V7a5 5 0 0 1 10 0v4"] as string[],
  mail:    ["M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z", "M22 6l-10 7L2 6"] as string[],
  chevL:   "M15 18l-6-6 6-6",
  checkCl: ["M22 11.08V12a10 10 0 1 1-5.93-9.14", "M22 4L12 14.01l-3-3"] as string[],
};

/* ── Field ──────────────────────────────────────────────── */
function Field({ label, type: t0, placeholder, value, onChange, icon, toggleable = false, autoComplete }: {
  label: string; type: string; placeholder: string;
  value: string; onChange: (v: string) => void;
  icon: string | string[]; toggleable?: boolean; autoComplete?: string;
}) {
  const [focused, setFocused] = useState(false);
  const [showPw,  setShowPw]  = useState(false);
  const type = toggleable ? (showPw ? "text" : "password") : t0;
  const inputId = useId();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label htmlFor={inputId} style={{ fontFamily: FONT, fontSize: 13.5, fontWeight: 600,
        color: focused ? "#1a2e1e" : "#111827", transition: "color .15s" }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)",
          color: focused ? "#1a2e1e" : "#9ca3af", pointerEvents: "none", transition: "color .15s" }}>
          <Ic d={icon} z={16} />
        </div>
        <input
          id={inputId}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoComplete={autoComplete ?? (t0 === "email" ? "email" : "current-password")}
          style={{
            width: "100%", height: 48,
            paddingLeft: 42, paddingRight: toggleable ? 44 : 14,
            borderRadius: 10,
            border: `1.5px solid ${focused ? "#1a2e1e" : "#e5e7eb"}`,
            background: "white",
            fontFamily: FONT, fontSize: 15, color: "#111827",
            transition: "border-color .15s, box-shadow .15s",
            boxShadow: focused ? "0 0 0 3px rgba(26,46,30,.08)" : "none",
          }}
        />
        {toggleable && (
          <button type="button" onClick={() => setShowPw(v => !v)} style={{
            position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
            background: "transparent", border: "none", color: "#9ca3af",
            display: "flex", alignItems: "center", padding: 4,
          }}>
            <Ic d={showPw ? I.eyeOff : I.eye} z={16} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Spinner ────────────────────────────────────────────── */
function Spinner() {
  return (
    <motion.div animate={{ rotate: 360 }}
      transition={{ duration: .8, repeat: Infinity, ease: "linear" }}
      style={{ width: 18, height: 18, borderRadius: "50%",
        border: "2px solid rgba(255,255,255,.3)", borderTopColor: "white" }} />
  );
}

/* ── Left panel (desktop) ───────────────────────────────── */
function LeftPanel() {
  const stats = [
    { n: "100%", l: "Données sécurisées" },
    { n: "EIE",  l: "EDD · Classification" },
    { n: "BTH",  l: "Expert Environnement" },
  ];
  return (
    <div style={{ flex: 1, background: "#1a2e1e", position: "relative",
      display: "flex", flexDirection: "column", justifyContent: "space-between",
      padding: "48px 52px", overflow: "hidden" }}>

      <div style={{ position: "absolute", right: -60, top: -60, opacity: .06, pointerEvents: "none" }}>
        <svg width={420} height={420} viewBox="0 0 24 24" fill="white" stroke="none">
          <path d="M2 22 16 8M22 2s-5.67 0-11 5c-4.17 4.17-4.83 9.33-3 11 1.83 1.67 7-1.17 11-5 5-5.33 5-11 5-11z"/>
        </svg>
      </div>
      <div style={{ position: "absolute", left: -40, bottom: -40, opacity: .04, pointerEvents: "none" }}>
        <svg width={300} height={300} viewBox="0 0 24 24" fill="white" stroke="none">
          <path d="M2 22 16 8M22 2s-5.67 0-11 5c-4.17 4.17-4.83 9.33-3 11 1.83 1.67 7-1.17 11-5 5-5.33 5-11 5-11z"/>
        </svg>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: .5 }}
        style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 11,
          background: "#edf5ef", border: "1px solid #90bb9a",
          display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Ic d={I.leaf} z={21} s="#1a2e1e" w={2.35} />
        </div>
        <span style={{ fontFamily: FONT, fontWeight: 650, fontSize: 16,
          color: "white", letterSpacing: "-0.4px" }}>BTH Hub</span>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: .6, delay: .15 }}>
        <p style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600,
          color: "rgba(255,255,255,.4)", textTransform: "uppercase",
          letterSpacing: "2px", marginBottom: 20 }}>BTH EXPERT · ALGÉRIE</p>
        <h2 style={{ fontFamily: FONT, fontWeight: 700, fontSize: 30,
          color: "white", letterSpacing: "-1px", lineHeight: 1.15, marginBottom: 20 }}>
          Gérez vos projets<br />environnementaux<br />en toute simplicité.
        </h2>
        <p style={{ fontFamily: FONT, fontSize: 15, color: "rgba(255,255,255,.5)",
          lineHeight: 1.6, maxWidth: 360 }}>
          Soumissions, clients, prospection et suivi financier — tout en un seul espace sécurisé.
        </p>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ duration: .6, delay: .3 }}
        style={{ display: "flex", borderTop: "1px solid rgba(255,255,255,.1)", paddingTop: 28 }}>
        {stats.map(({ n, l }, i) => (
          <div key={i} style={{ flex: 1,
            paddingRight: i < stats.length - 1 ? 24 : 0,
            paddingLeft: i > 0 ? 24 : 0,
            borderRight: i < stats.length - 1 ? "1px solid rgba(255,255,255,.1)" : "none" }}>
            <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 18,
              color: "white", letterSpacing: "-0.5px", marginBottom: 4 }}>{n}</p>
            <p style={{ fontFamily: FONT, fontSize: 11.5,
              color: "rgba(255,255,255,.4)", lineHeight: 1.4 }}>{l}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

/* ── Shared form content ────────────────────────────────── */
interface FormContentProps {
  email: string; setEmail: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  loading: boolean; error: string | null;
  forgotMode: boolean; setForgotMode: (v: boolean) => void;
  forgotEmail: string; setForgotEmail: (v: string) => void;
  forgotSent: boolean;
  handleSubmit: (e: React.FormEvent) => void;
  handleForgot: (e: React.FormEvent) => void;
  btnHeight?: number; btnRadius?: number; btnFontSize?: number;
}

function FormContent({
  email, setEmail, password, setPassword,
  loading, error,
  forgotMode, setForgotMode, forgotEmail, setForgotEmail, forgotSent,
  handleSubmit, handleForgot,
  btnHeight = 50, btnRadius = 12, btnFontSize = 15.5,
}: FormContentProps) {
  return (
    <AnimatePresence mode="wait">
      {forgotMode ? (
        /* ── Forgot password view ── */
        <motion.div key="forgot"
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
          transition={{ duration: .22 }}>

          <button type="button" onClick={() => setForgotMode(false)} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "none", border: "none", color: "#6b7280",
            fontFamily: FONT, fontSize: 13, fontWeight: 500, marginBottom: 28,
            padding: 0,
          }}>
            <Ic d={I.chevL} z={14} /> Retour à la connexion
          </button>

          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontFamily: FONT, fontWeight: 700, fontSize: btnFontSize === 16 ? 22 : 25,
              color: "#111827", letterSpacing: "-0.7px", lineHeight: 1.1, marginBottom: 8 }}>
              Mot de passe oublié
            </h1>
            <p style={{ fontFamily: FONT, fontSize: 14, color: "#6b7280", lineHeight: 1.5 }}>
              Entrez votre email pour recevoir un lien de réinitialisation.
            </p>
          </div>

          {forgotSent ? (
            <motion.div initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center",
                gap: 14, padding: "28px 16px", borderRadius: 14,
                background: "#f0fdf4", border: "1px solid #bbf7d0", textAlign: "center" }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%",
                background: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Ic d={I.checkCl} z={22} s="white" w={2.2} />
              </div>
              <p style={{ fontFamily: FONT, fontSize: 15, fontWeight: 600, color: "#15803d" }}>
                Email envoyé !
              </p>
              <p style={{ fontFamily: FONT, fontSize: 13.5, color: "#16a34a", lineHeight: 1.5 }}>
                Vérifiez votre boîte de réception et cliquez sur le lien pour réinitialiser votre mot de passe.
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleForgot} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <Field label="Adresse email" type="email" placeholder="vous@bthexpert.dz"
                value={forgotEmail} onChange={setForgotEmail} icon={I.mail} autoComplete="email" />

              {error && (
                <motion.div role="alert" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                  style={{ padding: "10px 14px", borderRadius: 9,
                    background: "#fef2f2", border: "1px solid #fecaca" }}>
                  <p style={{ fontFamily: FONT, fontSize: 13, color: "#dc2626", fontWeight: 500 }}>{error}</p>
                </motion.div>
              )}

              <motion.button type="submit" whileTap={{ scale: .98 }} style={{
                width: "100%", height: btnHeight, borderRadius: btnRadius,
                background: loading ? "#2d5a3d" : "#1a2e1e", border: "none", color: "white",
                fontFamily: FONT, fontWeight: 600, fontSize: btnFontSize,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "background .2s", boxShadow: "0 2px 12px rgba(26,46,30,.25)",
              }}>
                {loading ? <><Spinner /> Envoi…</> : "Envoyer le lien"}
              </motion.button>
            </form>
          )}
        </motion.div>
      ) : (
        /* ── Login view ── */
        <motion.div key="login"
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
          transition={{ duration: .22 }}>

          <div style={{ marginBottom: 36 }}>
            <h1 style={{ fontFamily: FONT, fontWeight: 700,
              fontSize: btnFontSize === 16 ? 23 : 26,
              color: "#111827", letterSpacing: "-0.8px", lineHeight: 1.1, marginBottom: 10 }}>
              Connexion
            </h1>
            <p style={{ fontFamily: FONT, fontSize: 14.5, color: "#6b7280", lineHeight: 1.5 }}>
              Accédez à votre espace de gestion BTH Hub.
            </p>
          </div>

          <form onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <Field label="Adresse email" type="email" placeholder="vous@bthexpert.dz"
              value={email} onChange={setEmail} icon={I.mail} autoComplete="email" />
            <Field label="Mot de passe" type="password" placeholder="••••••••••"
              value={password} onChange={setPassword} icon={I.lock} toggleable
              autoComplete="current-password" />

            <div style={{ textAlign: "right", marginTop: -6 }}>
              <button type="button" onClick={() => setForgotMode(true)} style={{
                background: "none", border: "none",
                fontFamily: FONT, fontSize: 13.5, fontWeight: 500, color: "#1a2e1e",
              }}>
                Mot de passe oublié ?
              </button>
            </div>

            {error && (
              <motion.div role="alert" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                style={{ padding: "10px 14px", borderRadius: 9,
                  background: "#fef2f2", border: "1px solid #fecaca" }}>
                <p style={{ fontFamily: FONT, fontSize: 13, color: "#dc2626", fontWeight: 500 }}>{error}</p>
              </motion.div>
            )}

            <motion.button type="submit" whileTap={{ scale: .98 }} style={{
              width: "100%", height: btnHeight, borderRadius: btnRadius,
              background: loading ? "#2d5a3d" : "#1a2e1e", border: "none", color: "white",
              fontFamily: FONT, fontWeight: 600, fontSize: btnFontSize,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "background .2s", boxShadow: "0 2px 12px rgba(26,46,30,.25)",
            }}>
              {loading ? <><Spinner /> Connexion…</> : "Se connecter"}
            </motion.button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Main export ────────────────────────────────────────── */
export default function LoginForm() {
  const router = useRouter();
  const bp     = useBp();

  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [forgotMode,  setForgotMode]  = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent,  setForgotSent]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) { setError("Veuillez remplir tous les champs."); return; }
    setError(null);
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError("Email ou mot de passe incorrect.");
      setLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    if (!forgotEmail) { setError("Veuillez entrer votre adresse email."); return; }
    setError(null);
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: window.location.origin + "/auth/callback",
    });
    setLoading(false);
    setForgotSent(true);
  }

  function handleSetForgotMode(v: boolean) {
    setForgotMode(v);
    setError(null);
    if (!v) { setForgotSent(false); setForgotEmail(""); }
  }

  const shared = {
    email, setEmail, password, setPassword,
    loading, error,
    forgotMode, setForgotMode: handleSetForgotMode,
    forgotEmail, setForgotEmail, forgotSent,
    handleSubmit, handleForgot,
  };

  /* ── Mobile ── */
  if (bp === "mobile") {
    return (
      <>
        <style>{CSS}</style>
        <div style={{ minHeight: "100vh", background: "#f6f6f4",
          display: "flex", flexDirection: "column", fontFamily: FONT }}>

          <div style={{ background: "#1a2e1e", padding: "52px 28px 40px",
            position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", right: -30, top: -30, opacity: .07, pointerEvents: "none" }}>
              <svg width={200} height={200} viewBox="0 0 24 24" fill="white" stroke="none">
                <path d="M2 22 16 8M22 2s-5.67 0-11 5c-4.17 4.17-4.83 9.33-3 11 1.83 1.67 7-1.17 11-5 5-5.33 5-11 5-11z"/>
              </svg>
            </div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: .5 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <div style={{ width: 40, height: 40, borderRadius: 11,
                  background: "#edf5ef", border: "1px solid #90bb9a",
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Ic d={I.leaf} z={21} s="#1a2e1e" w={2.35} />
                </div>
                <span style={{ fontFamily: FONT, fontWeight: 650, fontSize: 17,
                  color: "white", letterSpacing: "-0.4px" }}>BTH Hub</span>
              </div>
              <h1 style={{ fontFamily: FONT, fontWeight: 700, fontSize: 23,
                color: "white", letterSpacing: "-0.6px", lineHeight: 1.2, marginBottom: 8 }}>
                Bienvenue.
              </h1>
              <p style={{ fontFamily: FONT, fontSize: 14,
                color: "rgba(255,255,255,.55)", lineHeight: 1.5 }}>
                Connectez-vous à votre espace de gestion.
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: .45, delay: .15, ease: [.25, .46, .45, .94] }}
            style={{ flex: 1, background: "white", borderRadius: "24px 24px 0 0",
              marginTop: -20, padding: "48px 24px 40px",
              boxShadow: "0 -4px 24px rgba(0,0,0,.06)" }}>
            <FormContent {...shared} btnHeight={52} btnRadius={13} btnFontSize={16} />
          </motion.div>
        </div>
      </>
    );
  }

  /* ── Desktop ── */
  return (
    <>
      <style>{CSS}</style>
      <div style={{ height: "100vh", display: "flex", fontFamily: FONT, background: "white" }}>
        <LeftPanel />
        <div style={{ width: 480, display: "flex", flexDirection: "column",
          justifyContent: "center", alignItems: "center", padding: 48, background: "white" }}>
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: .5, delay: .2 }}
            style={{ width: "100%", maxWidth: 400 }}>
            <FormContent {...shared} btnHeight={50} btnRadius={12} btnFontSize={15.5} />
          </motion.div>
        </div>
      </div>
    </>
  );
}
