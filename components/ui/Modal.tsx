"use client";

import {
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { m as motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type ModalSize = "sm" | "md" | "lg";

const maxWidthClass: Record<ModalSize, string> = {
  sm: "max-w-[400px]",
  md: "max-w-[520px]",
  lg: "max-w-[680px]",
};

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  /** Titre accessible — relié au dialog via aria-labelledby */
  title?: ReactNode;
  /** Sous-titre optionnel sous le titre */
  subtitle?: ReactNode;
  /** Icône optionnelle à gauche du titre (ex. corbeille) */
  icon?: ReactNode;
  children?: ReactNode;
  /** Zone d'actions (boutons) en bas */
  footer?: ReactNode;
  size?: ModalSize;
  /** Désactive la fermeture au clic sur l'overlay (ex. pendant une sauvegarde) */
  dismissable?: boolean;
  className?: string;
  /** aria-label si aucun `title` textuel n'est fourni */
  ariaLabel?: string;
};

/**
 * Modale accessible partagée — BTH Hub.
 * - role="dialog" + aria-modal + aria-labelledby
 * - Échap pour fermer, focus-trap, restauration du focus déclencheur
 * - Verrouillage du scroll de l'arrière-plan
 * Rendue via portail sur <body> pour éviter les soucis de z-index/overflow.
 */
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  size = "sm",
  dismissable = true,
  className,
  ariaLabel,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const hasTitle = title != null;

  // Mémorise le déclencheur, place le focus dans la modale, restaure à la fermeture.
  useEffect(() => {
    if (!open) return;
    lastFocused.current = document.activeElement as HTMLElement | null;

    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus();

    return () => {
      lastFocused.current?.focus?.();
    };
  }, [open]);

  // Verrouille le scroll du body tant que la modale est ouverte.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Échap pour fermer + focus-trap (Tab cyclique).
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && dismissable) {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const items = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE)
      ).filter((el) => el.offsetParent !== null);
      if (items.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, dismissable]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[300]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={dismissable ? onClose : undefined}
            className="absolute inset-0 bg-black/30 backdrop-blur-[4px]"
          />
          <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={hasTitle ? titleId : undefined}
              aria-label={!hasTitle ? ariaLabel : undefined}
              tabIndex={-1}
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "pointer-events-auto w-full bg-white rounded-bth-xl shadow-[0_25px_60px_rgba(0,0,0,.15)] outline-none",
                maxWidthClass[size],
                className
              )}
            >
              {(hasTitle || icon) && (
                <div className="flex items-center gap-3 px-6 pt-6">
                  {icon}
                  <div className="min-w-0">
                    {hasTitle && (
                      <p
                        id={titleId}
                        className="font-bold text-[15px] text-bth-n-900"
                      >
                        {title}
                      </p>
                    )}
                    {subtitle != null && (
                      <p className="text-[11.5px] text-bth-n-500 mt-0.5 truncate">
                        {subtitle}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {children != null && (
                <div className="px-6 pt-4 text-[13px] text-bth-n-600">
                  {children}
                </div>
              )}

              {footer != null && (
                <div className="flex gap-2.5 px-6 pt-5 pb-6">{footer}</div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
