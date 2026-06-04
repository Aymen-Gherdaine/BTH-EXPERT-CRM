"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";

type ToastTone = "success" | "error" | "info";

type Toast = {
  id: number;
  message: string;
  tone: ToastTone;
};

type ToastApi = {
  show: (message: string, tone?: ToastTone) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

const toneStyles: Record<ToastTone, { bar: string; icon: ReactNode }> = {
  success: {
    bar: "bg-bth-success",
    icon: (
      <path
        d="M20 6L9 17l-5-5"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  error: {
    bar: "bg-bth-error",
    icon: (
      <>
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth={2} />
        <path d="M12 8v5M12 16h.01" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
      </>
    ),
  },
  info: {
    bar: "bg-bth-info",
    icon: (
      <>
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth={2} />
        <path d="M12 11v5M12 8h.01" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
      </>
    ),
  },
};

const toneColor: Record<ToastTone, string> = {
  success: "text-bth-success",
  error: "text-bth-error",
  info: "text-bth-info",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message: string, tone: ToastTone = "info") => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, message, tone }]);
      window.setTimeout(() => remove(id), 4000);
    },
    [remove]
  );

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (m: string) => show(m, "success"),
      error: (m: string) => show(m, "error"),
      info: (m: string) => show(m, "info"),
    }),
    [show]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* Région annoncée par les lecteurs d'écran */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed z-[400] bottom-[84px] md:bottom-6 right-4 left-4 md:left-auto flex flex-col items-center md:items-end gap-2 pointer-events-none"
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const tone = toneStyles[t.tone];
            return (
              <motion.div
                key={t.id}
                role={t.tone === "error" ? "alert" : "status"}
                layout
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => remove(t.id)}
                className="pointer-events-auto relative flex items-center gap-3 w-full md:w-auto md:max-w-[380px] overflow-hidden bg-white rounded-bth-lg shadow-[var(--bth-shadow-lg)] border border-bth-hairline pl-4 pr-4 py-3 cursor-pointer"
              >
                <span className={`absolute left-0 top-0 bottom-0 w-1 ${tone.bar}`} />
                <svg width={18} height={18} viewBox="0 0 24 24" className={`shrink-0 ${toneColor[t.tone]}`}>
                  {tone.icon}
                </svg>
                <span className="text-[13px] font-medium text-bth-n-800 leading-snug">
                  {t.message}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

/**
 * Accès au toast global. Renvoie une API stable même hors provider
 * (no-op) pour ne jamais casser un composant isolé / un test.
 */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (ctx) return ctx;
  const noop = () => {};
  return { show: noop, success: noop, error: noop, info: noop };
}
