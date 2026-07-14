"use client";

import type { CategorieDepense } from "@/types";
import { I, catCfg } from "./lib";

export function Icon({
  paths,
  size = 16,
  stroke = "currentColor",
  width = 1.7,
}: {
  paths: string | string[];
  size?: number;
  stroke?: string;
  width?: number;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round">
      {Array.isArray(paths) ? paths.map((path, index) => <path key={index} d={path} />) : <path d={paths} />}
    </svg>
  );
}

export function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

export function CategoryBadge({ category }: { category: CategorieDepense }) {
  const cat = catCfg(category);

  return (
    <span
      className="depenses-category"
      style={{
        background: cat.bg,
        color: cat.text,
        border: `1px solid ${cat.border}`,
      }}
    >
      <span className="depenses-dot" style={{ background: cat.dot }} />
      {cat.abbr}
    </span>
  );
}

export function ExpenseActions({
  hasReceipt,
  deleting,
  onReceipt,
  onEdit,
  onDelete,
}: {
  hasReceipt: boolean;
  deleting: boolean;
  onReceipt: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="depenses-actions">
      {hasReceipt && (
        <button className="depenses-icon-btn" type="button" onClick={onReceipt} title="Voir justificatif">
          <Icon paths={I.paperclip} size={14} />
        </button>
      )}
      <button className="depenses-icon-btn" type="button" onClick={onEdit} title="Modifier">
        <Icon paths={I.edit} size={14} />
      </button>
      <button className="depenses-icon-btn danger" type="button" onClick={onDelete} disabled={deleting} title="Supprimer">
        {deleting ? <Spinner /> : <Icon paths={I.trash} size={14} />}
      </button>
    </div>
  );
}

export function SelectChevron() {
  return (
    <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#887f74", pointerEvents: "none" }}>
      <Icon paths={I.chevronDown} size={13} />
    </span>
  );
}
