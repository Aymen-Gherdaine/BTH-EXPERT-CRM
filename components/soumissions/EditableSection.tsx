"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type FieldDef = {
  key: string;
  label: string;
  value: string;
  multiline?: boolean;
};

interface Props {
  title: string;
  icon?: React.ReactNode;
  fields: FieldDef[];
  onSave: (updates: Record<string, string>) => void;
  onEditRequest: () => void;
  onCancel: () => void;
  isEditing: boolean;
  showSaved?: boolean;
  accentColor?: string;
  renderContent?: React.ReactNode;
}

export default function EditableSection({
  title,
  icon,
  fields,
  onSave,
  onEditRequest,
  onCancel,
  isEditing,
  showSaved = false,
  accentColor = "#3C7C95",
  renderContent,
}: Props) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  // FIX 2 — ref for scroll-into-view on edit
  const sectionRef = useRef<HTMLDivElement>(null);

  // Init drafts from current field values when entering edit mode
  useEffect(() => {
    if (isEditing) {
      const init: Record<string, string> = {};
      fields.forEach((f) => {
        init[f.key] = f.value;
      });
      setDrafts(init);
      // FIX 2 — scroll section into view with 80px top margin (scroll-mt-20)
      setTimeout(() => {
        sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  const defaultReadContent = (
    <div className="pl-5 pr-4 pb-4">
      {fields.map((f) => (
        <div key={f.key} className="mt-1">
          {f.multiline ? (
            f.value
              .split("\n")
              .filter((l) => l.trim())
              .map((line, i) => (
                <p key={i} className="text-sm text-gray-700 leading-relaxed mb-1.5">
                  {line.trim()}
                </p>
              ))
          ) : (
            <p className="text-sm text-gray-700">{f.value}</p>
          )}
        </div>
      ))}
    </div>
  );

  return (
    // FIX 2 — scroll-mt-20 adds 80px top gap when scrolled into view (accounts for sticky header)
    <div
      ref={sectionRef}
      className={`group relative bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm ${
        isEditing ? "scroll-mt-20" : ""
      }`}
    >
      {/* Accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl"
        style={{ backgroundColor: accentColor }}
      />

      {/* Header row */}
      <div className="flex items-center justify-between pl-5 pr-3 pt-3 pb-2">
        <div className="flex items-center gap-2">
          {icon && <span className="text-sm text-gray-400">{icon}</span>}
          <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
            {title}
          </span>
        </div>

        {/* Pencil / checkmark — always visible mobile, hover-only desktop */}
        <AnimatePresence mode="wait">
          {!isEditing && (
            <motion.button
              key="pencil-btn"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.12 }}
              type="button"
              onClick={onEditRequest}
              aria-label={`Éditer ${title}`}
              className="
                min-w-[44px] min-h-[44px] md:min-w-[28px] md:min-h-[28px]
                w-11 h-11 md:w-7 md:h-7
                rounded-lg flex items-center justify-center
                transition-colors hover:bg-gray-100 cursor-pointer
                opacity-100 md:opacity-0 md:group-hover:opacity-100 md:transition-opacity md:duration-150
              "
            >
              <AnimatePresence mode="wait">
                {showSaved ? (
                  <motion.svg
                    key="check"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="w-4 h-4 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </motion.svg>
                ) : (
                  <motion.svg
                    key="pencil"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="w-3.5 h-3.5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </motion.svg>
                )}
              </AnimatePresence>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Content area */}
      <AnimatePresence mode="wait" initial={false}>
        {isEditing ? (
          <motion.div
            key="edit"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="pl-5 pr-4 pb-3 space-y-3">
              {fields.map((f) => (
                <div key={f.key}>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1 uppercase tracking-wide">
                    {f.label}
                  </label>
                  {f.multiline ? (
                    <AutoResizeTextarea
                      value={drafts[f.key] ?? f.value}
                      onChange={(v) =>
                        setDrafts((d) => ({ ...d, [f.key]: v }))
                      }
                    />
                  ) : (
                    <input
                      type="text"
                      value={drafts[f.key] ?? f.value}
                      onChange={(e) =>
                        setDrafts((d) => ({ ...d, [f.key]: e.target.value }))
                      }
                      className="w-full px-3 py-2.5 rounded-lg text-sm text-gray-900 border outline-none transition-shadow"
                      style={{ borderColor: "#1a2e1e" }}
                      onFocus={(e) => {
                        e.target.style.boxShadow =
                          "0 0 0 3px rgba(26,46,30,0.12)";
                      }}
                      onBlur={(e) => {
                        e.target.style.boxShadow = "none";
                      }}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="pl-5 pr-4 pb-4 flex gap-2">
              <motion.button
                type="button"
                onClick={() => onSave(drafts)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold text-white cursor-pointer min-h-[44px]"
                style={{ backgroundColor: "#1a2e1e" }}
              >
                <svg
                  className="w-3.5 h-3.5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                  />
                </svg>
                Sauvegarder
              </motion.button>
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer min-h-[44px]"
              >
                Annuler
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="read"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {renderContent ?? defaultReadContent}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// FIX 3 — auto-resize: height = scrollHeight + 24px, overflow:hidden prevents inner scrollbar
function AutoResizeTextarea({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = `${ref.current.scrollHeight + 24}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      rows={3}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2.5 rounded-lg text-sm text-gray-900 border outline-none resize-none transition-shadow overflow-hidden"
      style={{ borderColor: "#1a2e1e", minHeight: "80px" }}
      onFocus={(e) => {
        e.target.style.boxShadow = "0 0 0 3px rgba(26,46,30,0.12)";
      }}
      onBlur={(e) => {
        e.target.style.boxShadow = "none";
      }}
    />
  );
}
