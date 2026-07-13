"use client";

import { Dispatch, SetStateAction } from "react";
import { m as motion } from "framer-motion";
import { I } from "../constants";
import { Ic } from "./Ic";

export function Pager({ page, total, perPage, onPage, hideWhenSinglePage = false }: {
  page: number;
  total: number;
  perPage: number;
  onPage: Dispatch<SetStateAction<number>>;
  hideWhenSinglePage?: boolean;
}) {
  if (total === 0) return null;
  const pages = Math.max(1, Math.ceil(total / perPage));
  if (hideWhenSinglePage && pages <= 1) return null;
  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);
  return (
    <div style={{
      flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "10px 24px", borderTop: "1px solid #e8e2d8",
      background: "#fffdfa",
    }} className="submission-pager">
      <span style={{ fontSize: 12, color: "#6b7280" }}>
        <strong style={{ color: "#111827" }}>{from}–{to}</strong>
        {" "}sur{" "}
        <strong style={{ color: "#111827" }}>{total}</strong>
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <motion.button whileTap={{ scale: 0.94 }}
          onClick={() => onPage(p => Math.max(1, p - 1))} disabled={page <= 1}
          style={{ width: 32, height: 32, borderRadius: 9999, border: "1px solid #e8e2d8", background: "white", display: "flex", alignItems: "center", justifyContent: "center", color: page <= 1 ? "#d0c9be" : "#1a2e1e", cursor: page <= 1 ? "default" : "pointer" }}
        >
          <Ic d={I.chevL} z={13} />
        </motion.button>
        <span style={{ fontSize: 12, color: "#374151", fontWeight: 500, minWidth: 76, textAlign: "center", userSelect: "none" }}>
          Page {page} / {pages}
        </span>
        <motion.button whileTap={{ scale: 0.94 }}
          onClick={() => onPage(p => Math.min(pages, p + 1))} disabled={page >= pages}
          style={{ width: 32, height: 32, borderRadius: 9999, border: "1px solid #e8e2d8", background: "white", display: "flex", alignItems: "center", justifyContent: "center", color: page >= pages ? "#d0c9be" : "#1a2e1e", cursor: page >= pages ? "default" : "pointer" }}
        >
          <Ic d={I.chevR} z={13} />
        </motion.button>
      </div>
    </div>
  );
}
