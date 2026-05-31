"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { CategorieDepense, Depense } from "@/types";
import { formatMontant } from "@/lib/utils";
import { useDynamicPerPage } from "@/hooks/useDynamicPerPage";

const CSS = `
  @keyframes depSk { 0%,100%{opacity:1} 50%{opacity:.42} }
  .dep-sk { animation: depSk 1.45s ease-in-out infinite; }

  .depenses-page {
    height: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: linear-gradient(180deg, #ffffff 0%, #faf8f5 42%, #f6f1e9 100%);
    color: #1a1714;
  }
  .depenses-header {
    flex-shrink: 0;
    padding: 24px clamp(16px, 3vw, 40px) 18px;
    border-bottom: 1px solid #e8e2d8;
    background: rgba(255,255,255,.9);
  }
  .depenses-header-top {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 16px;
    align-items: start;
  }
  .depenses-kicker {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 7px;
    color: #a8874e;
    font-size: 11px;
    font-weight: 800;
  }
  .depenses-kicker::before {
    content: "";
    width: 28px;
    height: 1px;
    background: #c9a96e;
  }
  .depenses-title {
    margin: 0;
    font-family: var(--font-display);
    font-size: 28px;
    line-height: 1.04;
    font-weight: 600;
    color: #1a1714;
    letter-spacing: 0;
  }
  .depenses-subtitle {
    margin: 6px 0 0;
    color: #887f74;
    font-size: 14px;
  }
  .depenses-add-btn {
    height: 44px;
    border: 0;
    border-radius: 9999px;
    padding: 0 18px;
    background: #1a2e1e;
    color: #ffffff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 800;
    cursor: pointer;
    box-shadow: 0 16px 34px rgba(26,46,30,.20);
    white-space: nowrap;
  }
  .depenses-stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin-top: 18px;
  }
  .depenses-stat {
    min-height: 86px;
    border-radius: 16px;
    border: 1px solid #e8e2d8;
    background: linear-gradient(180deg, #fffdfa 0%, #ffffff 100%);
    padding: 15px 16px;
    box-shadow: 0 16px 40px rgba(26,46,30,.06);
    position: relative;
    overflow: hidden;
  }
  .depenses-stat::after {
    content: "";
    position: absolute;
    right: -36px;
    top: -42px;
    width: 92px;
    height: 92px;
    border-radius: 9999px;
    background: rgba(201,169,110,.11);
  }
  .depenses-stat-label {
    color: #9a9184;
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: .1em;
  }
  .depenses-stat-value {
    margin-top: 9px;
    color: #0b1620;
    font-size: 24px;
    line-height: 1;
    font-weight: 750;
    font-variant-numeric: tabular-nums;
  }
  .depenses-stat-value small {
    margin-left: 4px;
    color: #887f74;
    font-size: 11px;
    font-weight: 700;
  }
  .depenses-stat-note {
    margin-top: 7px;
    color: #887f74;
    font-size: 12px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .depenses-content {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    padding: 16px clamp(16px, 3vw, 40px) 18px;
  }
  .depenses-tools {
    flex-shrink: 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(180px, 220px);
    gap: 10px;
    margin-bottom: 12px;
  }
  .depenses-field {
    position: relative;
  }
  .depenses-field svg {
    position: absolute;
    left: 15px;
    top: 50%;
    transform: translateY(-50%);
    color: #887f74;
    pointer-events: none;
  }
  .depenses-input,
  .depenses-select {
    width: 100%;
    height: 44px;
    box-sizing: border-box;
    border-radius: 9999px;
    border: 1px solid #d0c9be;
    background: #ffffff;
    color: #1a1714;
    font-size: 14px;
    outline: none;
    box-shadow: 0 10px 26px rgba(26,46,30,.04);
  }
  .depenses-input {
    padding: 0 16px 0 44px;
  }
  .depenses-select {
    appearance: none;
    padding: 0 38px 0 15px;
    cursor: pointer;
  }
  .depenses-input:focus,
  .depenses-select:focus,
  .depenses-form-input:focus,
  .depenses-form-select:focus {
    border-color: #1a2e1e;
    box-shadow: 0 0 0 4px rgba(26,46,30,.10);
  }
  .depenses-shell {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    border-radius: 16px;
    border: 1px solid #e8e2d8;
    background: rgba(255,255,255,.92);
    box-shadow: 0 20px 50px rgba(26,46,30,.07);
  }
  .depenses-table-scroll {
    height: 100%;
    overflow: auto;
    scrollbar-width: thin;
    scrollbar-color: #C9A96E #f5f0e8;
  }
  .depenses-table-scroll::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  .depenses-table-scroll::-webkit-scrollbar-track {
    background: #f5f0e8;
  }
  .depenses-table-scroll::-webkit-scrollbar-thumb {
    background: #C9A96E;
    border-radius: 9999px;
  }
  .depenses-table {
    min-width: 920px;
  }
  .depenses-table-head,
  .depenses-table-row {
    display: grid;
    grid-template-columns: minmax(260px, 1.15fr) minmax(310px, 1.25fr) 130px 170px 136px;
    align-items: stretch;
  }
  .depenses-table-head {
    position: sticky;
    top: 0;
    z-index: 2;
    min-height: 48px;
    background: #fbfaf7;
    border-bottom: 1px solid #e8e2d8;
  }
  .depenses-th {
    display: flex;
    align-items: center;
    padding: 0 16px;
    border-right: 1px solid #e8e2d8;
    color: #9a9184;
    font-size: 10.5px;
    font-weight: 800;
    letter-spacing: .08em;
    text-transform: uppercase;
  }
  .depenses-th:last-child {
    border-right: 0;
  }
  .depenses-table-row {
    min-height: 66px;
    background: #ffffff;
    border-bottom: 1px solid #f0ebe3;
    transition: background .16s ease, box-shadow .16s ease;
  }
  .depenses-table-row:hover {
    background: #fffdfa;
    box-shadow: inset 3px 0 0 #C9A96E;
  }
  .depenses-td {
    display: flex;
    align-items: center;
    min-width: 0;
    padding: 0 16px;
    border-right: 1px solid #f0ebe3;
  }
  .depenses-td:last-child {
    border-right: 0;
  }
  .depenses-category {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 58px;
    justify-content: center;
    padding: 5px 9px;
    border-radius: 9999px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .04em;
  }
  .depenses-dot {
    width: 6px;
    height: 6px;
    border-radius: 9999px;
    flex-shrink: 0;
  }
  .depenses-desc {
    min-width: 0;
    color: #1a1714;
    font-size: 13.5px;
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .depenses-muted {
    color: #887f74;
    font-size: 12px;
  }
  .depenses-project {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    min-width: 0;
    color: #635c54;
    font-size: 12.5px;
  }
  .depenses-project span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .depenses-amount {
    width: 100%;
    text-align: right;
    color: #0b1620;
    font-size: 15px;
    font-weight: 750;
    font-variant-numeric: tabular-nums;
  }
  .depenses-amount small {
    color: #887f74;
    font-size: 10.5px;
    font-weight: 700;
    margin-left: 3px;
  }
  .depenses-actions {
    display: inline-flex;
    gap: 6px;
    justify-content: flex-end;
    width: 100%;
  }
  .depenses-icon-btn {
    width: 32px;
    height: 32px;
    border-radius: 9999px;
    border: 1px solid #e8e2d8;
    background: #fffdfa;
    color: #635c54;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background .15s ease, border-color .15s ease, color .15s ease, transform .15s ease;
  }
  .depenses-icon-btn:hover {
    transform: translateY(-1px);
    background: #f5f0e8;
    border-color: #d0c9be;
    color: #1a2e1e;
  }
  .depenses-icon-btn.danger {
    border-color: #f0c8c0;
    color: #c44a3a;
    background: #fff7f5;
  }
  .depenses-edit-panel {
    border-bottom: 1px solid #e8e2d8;
    background: #fbfaf7;
  }
  .depenses-edit-title {
    padding: 12px 16px;
    border-bottom: 1px solid #e8e2d8;
    color: #635c54;
    font-size: 12px;
    font-weight: 800;
  }
  .depenses-card-list {
    height: 100%;
    overflow: auto;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .depenses-card {
    position: relative;
    border-radius: 16px;
    border: 1px solid #e8e2d8;
    background: linear-gradient(180deg, #fffdfa 0%, #ffffff 100%);
    box-shadow: 0 14px 34px rgba(26,46,30,.06);
    overflow: hidden;
  }
  .depenses-card::before {
    content: "";
    position: absolute;
    inset: 0 0 auto 0;
    height: 3px;
    background: linear-gradient(90deg, #1a2e1e 0%, #C9A96E 100%);
  }
  .depenses-card-body {
    padding: 15px 14px 14px;
  }
  .depenses-card-top,
  .depenses-card-meta,
  .depenses-card-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }
  .depenses-card-title {
    margin: 11px 0 5px;
    color: #1a1714;
    font-size: 14.5px;
    font-weight: 800;
    line-height: 1.25;
  }
  .depenses-card-meta {
    align-items: flex-start;
    color: #887f74;
    font-size: 12px;
  }
  .depenses-card-actions {
    justify-content: flex-end;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #f0ebe3;
  }
  .depenses-card-amount-row {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 10px;
    margin-top: 10px;
  }
  .depenses-empty {
    min-height: 340px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 48px 20px;
    color: #887f74;
  }
  .depenses-empty-icon {
    width: 54px;
    height: 54px;
    border-radius: 16px;
    background: #f5f0e8;
    color: #a8874e;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 14px;
  }
  .depenses-history-end {
    padding: 18px 24px;
    text-align: center;
    color: #9a9184;
    font-size: 12px;
    border-top: 1px solid #f0ebe3;
  }
  .depenses-pagination {
    flex-shrink: 0;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 12px;
    padding: 10px clamp(16px, 3vw, 40px);
    border-top: 1px solid #e8e2d8;
    background: #fbfaf7;
  }
  .depenses-page-count {
    color: #887f74;
    font-size: 12.5px;
  }
  .depenses-pager {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }
  .depenses-page-btn {
    width: 34px;
    height: 34px;
    border-radius: 9999px;
    border: 1px solid #e8e2d8;
    background: #ffffff;
    color: #1a2e1e;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  .depenses-page-btn:disabled {
    color: #c8c1b7;
    cursor: default;
    opacity: .65;
  }
  .depenses-page-label {
    min-width: 70px;
    text-align: center;
    color: #1a1714;
    font-size: 13px;
    font-weight: 800;
  }
  .depenses-form {
    padding: 16px 18px 18px;
  }
  .depenses-form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 12px;
  }
  .depenses-form-label {
    display: block;
    margin-bottom: 6px;
    color: #887f74;
    font-size: 10.5px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: .08em;
  }
  .depenses-form-input,
  .depenses-form-select {
    width: 100%;
    min-height: 42px;
    box-sizing: border-box;
    border-radius: 12px;
    border: 1px solid #d0c9be;
    background: #ffffff;
    color: #1a1714;
    font-size: 13px;
    outline: none;
    padding: 0 13px;
  }
  .depenses-form-select {
    appearance: none;
    padding-right: 34px;
    cursor: pointer;
  }
  .depenses-file {
    min-height: 44px;
    padding: 9px 12px;
    border-radius: 12px;
    border: 1px dashed #d0c9be;
    background: #fffdfa;
    color: #887f74;
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
  }
  .depenses-form-actions {
    display: flex;
    gap: 9px;
    margin-top: 14px;
  }
  .depenses-submit,
  .depenses-cancel {
    height: 42px;
    border-radius: 9999px;
    font-size: 13px;
    font-weight: 800;
    cursor: pointer;
  }
  .depenses-submit {
    flex: 1;
    border: 0;
    background: #1a2e1e;
    color: #ffffff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
  }
  .depenses-cancel {
    padding: 0 16px;
    border: 1px solid #d0c9be;
    background: #ffffff;
    color: #635c54;
  }
  @media (max-width: 767px) {
    .depenses-page {
      height: auto;
      min-height: 100%;
      overflow: visible;
    }
    .depenses-page.has-mobile-pagination {
      padding-bottom: calc(62px + env(safe-area-inset-bottom));
    }
    .depenses-header {
      padding: 13px 14px 12px;
    }
    .depenses-header-top {
      gap: 10px;
      align-items: center;
    }
    .depenses-kicker {
      margin-bottom: 4px;
      font-size: 10px;
      gap: 8px;
    }
    .depenses-kicker::before {
      width: 20px;
    }
    .depenses-title {
      font-size: 26px;
    }
    .depenses-subtitle {
      margin-top: 3px;
      font-size: 12px;
    }
    .depenses-add-btn {
      width: 42px;
      height: 42px;
      padding: 0;
      box-shadow: 0 12px 28px rgba(26,46,30,.18);
    }
    .depenses-stats {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      overflow: visible;
      gap: 6px;
      margin-top: 11px;
      padding-bottom: 0;
    }
    .depenses-stat {
      min-height: 58px;
      border-radius: 12px;
      padding: 8px 9px;
      box-shadow: 0 8px 20px rgba(26,46,30,.04);
    }
    .depenses-stat::after {
      display: none;
    }
    .depenses-stat-label {
      font-size: 8px;
      letter-spacing: .05em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .depenses-stat-value {
      margin-top: 6px;
      font-size: 15px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .depenses-stat-value small {
      display: none;
    }
    .depenses-stat-note {
      display: none;
    }
    .depenses-content {
      flex: none;
      display: block;
      min-height: auto;
      padding: 12px 12px 10px;
    }
    .depenses-tools {
      grid-template-columns: 1fr;
      gap: 7px;
      margin-bottom: 10px;
    }
    .depenses-input,
    .depenses-select {
      height: 42px;
      font-size: 13px;
    }
    .depenses-shell {
      border-radius: 16px;
      overflow: visible;
      background: transparent;
      border: 0;
      box-shadow: none;
    }
    .depenses-card-list {
      height: auto;
      overflow: visible;
      padding: 0;
      gap: 10px;
    }
    .depenses-card {
      border-radius: 14px;
      box-shadow: 0 10px 26px rgba(26,46,30,.06);
    }
    .depenses-card-body {
      padding: 13px 13px 12px;
    }
    .depenses-card-title {
      margin: 8px 0 5px;
      font-size: 14px;
      line-height: 1.3;
      word-break: break-word;
      overflow-wrap: break-word;
    }
    .depenses-card-amount-row {
      margin-top: 9px;
      align-items: center;
    }
    .depenses-card .depenses-amount {
      width: auto;
      max-width: 58%;
      font-size: 17px;
      line-height: 1.05;
      text-align: right;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .depenses-card .depenses-amount small {
      display: block;
      margin-left: 0;
      margin-top: 2px;
      font-size: 9px;
    }
    .depenses-card .depenses-project {
      display: flex;
      max-width: 100%;
      overflow: hidden;
    }
    .depenses-card-amount-row > span:first-child {
      flex-shrink: 0;
    }
    .depenses-card-actions {
      margin-top: 10px;
      padding-top: 10px;
    }
    .depenses-icon-btn {
      width: 34px;
      height: 34px;
    }
    .depenses-form {
      padding: 14px;
    }
    .depenses-form-grid {
      grid-template-columns: 1fr;
    }
    .depenses-pagination {
      grid-template-columns: 1fr auto;
      padding: 10px 14px calc(12px + env(safe-area-inset-bottom));
      background: rgba(251,250,247,.94);
      position: fixed;
      left: 0;
      right: 0;
      bottom: calc(56px + env(safe-area-inset-bottom));
      z-index: 19;
      box-shadow: 0 -10px 28px rgba(26,46,30,.06);
    }
    .depenses-page-count {
      font-size: 12px;
    }
    .depenses-pagination > span:last-child {
      display: none;
    }
    .depenses-page-btn {
      width: 32px;
      height: 32px;
    }
    .depenses-page-label {
      min-width: 52px;
      font-size: 12px;
    }
  }
`;

type Breakpoint = "mobile" | "tablet" | "desktop";

type SoumissionOption = {
  id: string;
  titre_projet: string;
  numero_offre: string;
};

type FormState = {
  categorie: CategorieDepense | "";
  montant: string;
  description: string;
  date_depense: string;
  projet_lie: string;
};

type CatConfig = {
  value: CategorieDepense;
  label: string;
  abbr: string;
  bg: string;
  text: string;
  dot: string;
  border: string;
};

const CATEGORIES: CatConfig[] = [
  { value: "mission", label: "Mission", abbr: "MIS", bg: "#eef6fb", text: "#2b668b", dot: "#3a7ca5", border: "#bdd9ea" },
  { value: "vehicule", label: "Véhicule", abbr: "VEH", bg: "#fff7df", text: "#8b6a24", dot: "#C9A96E", border: "#f3dfa0" },
  { value: "repas", label: "Repas", abbr: "REP", bg: "#edf7ef", text: "#1f6b3a", dot: "#3a7a50", border: "#c1d9c6" },
  { value: "materiel", label: "Matériel", abbr: "MAT", bg: "#f5f0e8", text: "#635c54", dot: "#887f74", border: "#d0c9be" },
  { value: "communication", label: "Communication", abbr: "COM", bg: "#f2f7f3", text: "#2b5c3c", dot: "#5d9a6e", border: "#c1d9c6" },
  { value: "autre", label: "Autre", abbr: "AUT", bg: "#fbfaf7", text: "#635c54", dot: "#b0a898", border: "#e8e2d8" },
];

const EMPTY_FORM: FormState = {
  categorie: "",
  montant: "",
  description: "",
  date_depense: new Date().toISOString().slice(0, 10),
  projet_lie: "",
};


function useBp(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>("mobile");

  useEffect(() => {
    const onResize = () => {
      setBp(window.innerWidth >= 1024 ? "desktop" : window.innerWidth >= 640 ? "tablet" : "mobile");
    };

    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return bp;
}

function catCfg(cat: string): CatConfig {
  return CATEGORIES.find((c) => c.value === cat) ?? CATEGORIES[CATEGORIES.length - 1];
}

function Icon({
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

const I = {
  search: "M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z",
  plus: "M12 5v14M5 12h14",
  x: "M18 6L6 18M6 6l12 12",
  chevronLeft: "M15 18l-6-6 6-6",
  chevronRight: "M9 18l6-6-6-6",
  chevronDown: "M6 9l6 6 6-6",
  file: ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", "M14 2v6h6"],
  edit: ["M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5", "M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"],
  trash: ["M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7", "M10 11v6M14 11v6M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3M4 7h16"],
  paperclip: "M15.172 7l-6.586 6.586a2 2 0 1 0 2.828 2.828l6.414-6.586a4 4 0 0 0-5.656-5.656l-6.415 6.585a6 6 0 1 0 8.486 8.486L20.5 13",
  project: ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", "M14 2v6h6", "M8 13h8M8 17h5"],
};

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

function formatDateShort(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("fr-DZ", {
    day: "2-digit",
    month: "short",
  });
}

function formatMontantCompact(amount: number) {
  return Math.round(amount).toLocaleString("fr-DZ");
}

function projectLabel(project?: SoumissionOption) {
  if (!project) return null;
  return `${project.numero_offre} - ${project.titre_projet}`;
}

function CategoryBadge({ category }: { category: CategorieDepense }) {
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

function ExpenseActions({
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

function SelectChevron() {
  return (
    <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#887f74", pointerEvents: "none" }}>
      <Icon paths={I.chevronDown} size={13} />
    </span>
  );
}

interface DepenseFormProps {
  form: FormState;
  onChange: React.Dispatch<React.SetStateAction<FormState>>;
  onSubmit: (event: React.FormEvent) => void;
  onCancel: () => void;
  saving: boolean;
  photo: File | null;
  onPhoto: (file: File | null) => void;
  soumissions: SoumissionOption[];
  submitLabel: string;
}

function DepenseForm({
  form,
  onChange,
  onSubmit,
  onCancel,
  saving,
  photo,
  onPhoto,
  soumissions,
  submitLabel,
}: DepenseFormProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <form className="depenses-form" onSubmit={onSubmit}>
      <div className="depenses-form-grid">
        <div>
          <label className="depenses-form-label">Montant (DZD) *</label>
          <input
            className="depenses-form-input"
            type="number"
            min="0"
            step="0.01"
            placeholder="0,00"
            value={form.montant}
            onChange={(event) => onChange((current) => ({ ...current, montant: event.target.value }))}
            required
          />
        </div>
        <div>
          <label className="depenses-form-label">Catégorie *</label>
          <div style={{ position: "relative" }}>
            <select
              className="depenses-form-select"
              value={form.categorie}
              onChange={(event) => onChange((current) => ({ ...current, categorie: event.target.value as CategorieDepense }))}
              required
            >
              <option value="">Choisir...</option>
              {CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            <SelectChevron />
          </div>
        </div>
      </div>

      <div className="depenses-form-grid">
        <div>
          <label className="depenses-form-label">Date</label>
          <input
            className="depenses-form-input"
            type="date"
            value={form.date_depense}
            onChange={(event) => onChange((current) => ({ ...current, date_depense: event.target.value }))}
          />
        </div>
        <div>
          <label className="depenses-form-label">Projet lié</label>
          <div style={{ position: "relative" }}>
            <select
              className="depenses-form-select"
              value={form.projet_lie}
              onChange={(event) => onChange((current) => ({ ...current, projet_lie: event.target.value }))}
            >
              <option value="">Aucun</option>
              {soumissions.map((soumission) => (
                <option key={soumission.id} value={soumission.id}>
                  {soumission.numero_offre} - {soumission.titre_projet}
                </option>
              ))}
            </select>
            <SelectChevron />
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label className="depenses-form-label">Description</label>
        <input
          className="depenses-form-input"
          type="text"
          placeholder="Notes optionnelles..."
          value={form.description}
          onChange={(event) => onChange((current) => ({ ...current, description: event.target.value }))}
        />
      </div>

      <div>
        <label className="depenses-form-label">Justificatif</label>
        <div className="depenses-file" onClick={() => fileRef.current?.click()} role="button" tabIndex={0}>
          <Icon paths={I.paperclip} size={15} stroke="#a8874e" />
          <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12 }}>
            {photo ? photo.name : "Photo ou fichier (optionnel)"}
          </span>
          {photo && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onPhoto(null);
              }}
              style={{ border: 0, background: "transparent", color: "#887f74", cursor: "pointer", padding: 0, display: "flex" }}
              aria-label="Retirer le fichier"
            >
              <Icon paths={I.x} size={14} />
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(event) => onPhoto(event.target.files?.[0] ?? null)} />
      </div>

      <div className="depenses-form-actions">
        <motion.button className="depenses-submit" type="submit" disabled={saving} whileTap={saving ? undefined : { scale: 0.97 }}>
          {saving && <Spinner />}
          {submitLabel}
        </motion.button>
        <button className="depenses-cancel" type="button" onClick={onCancel}>
          Annuler
        </button>
      </div>
    </form>
  );
}

export default function DepensesPageClient({
  initialDepenses,
  initialSoumissions,
  initialUserId,
}: {
  initialDepenses: Depense[];
  initialSoumissions: SoumissionOption[];
  initialUserId: string | null;
}) {
  const bp = useBp();
  const isDesktop = bp !== "mobile";
  const gridRef = useRef<HTMLElement>(null);
  // ref on .depenses-shell; tableHeaderHeight=48 (.depenses-table-head); pagerHeight=52 (footer below content)
  const perPage = useDynamicPerPage(gridRef, { view: "table", isDesktop, rowHeight: 66, tableHeaderHeight: 48, pagerHeight: 52, mobilePerPage: 6 });

  const [depenses, setDepenses] = useState<Depense[]>(initialDepenses);
  const [soumissions] = useState<SoumissionOption[]>(initialSoumissions);
  const [userId] = useState<string | null>(initialUserId);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [photo, setPhoto] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM);
  const [editPhoto, setEditPhoto] = useState<File | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<CategorieDepense | "">("");

  const currentMonth = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  const thisMonth = useMemo(
    () => depenses.filter((depense) => depense.date_depense.startsWith(currentMonth)),
    [currentMonth, depenses]
  );

  const totalThisMonth = useMemo(
    () => thisMonth.reduce((sum, depense) => sum + Number(depense.montant), 0),
    [thisMonth]
  );

  const byCat = useMemo(
    () =>
      CATEGORIES.map((category) => ({
        ...category,
        total: thisMonth
          .filter((depense) => depense.categorie === category.value)
          .reduce((sum, depense) => sum + Number(depense.montant), 0),
      }))
        .filter((category) => category.total > 0)
        .sort((a, b) => b.total - a.total),
    [thisMonth]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return depenses.filter((depense) => {
      if (catFilter && depense.categorie !== catFilter) return false;
      if (!query) return true;

      const project = soumissions.find((soumission) => soumission.id === depense.projet_lie);
      return (
        depense.description?.toLowerCase().includes(query) ||
        depense.categorie.toLowerCase().includes(query) ||
        project?.titre_projet.toLowerCase().includes(query) ||
        project?.numero_offre.toLowerCase().includes(query)
      );
    });
  }, [catFilter, depenses, search, soumissions]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const showPagination = filtered.length > 0 && totalPages > 1;

  useEffect(() => setPage(1), [search, catFilter]);
  useEffect(() => setPage((current) => Math.min(current, totalPages)), [totalPages]);

  async function uploadPhoto(file: File, depenseId: string): Promise<string | null> {
    if (!userId) return null;

    const supabase = createSupabaseBrowserClient();
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/${depenseId}.${ext}`;
    const { error } = await supabase.storage.from("justificatifs").upload(path, file, { upsert: true });
    if (error) return null;
    return path;
  }

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    if (!form.categorie || !form.montant) return;

    setSaving(true);
    const response = await fetch("/api/depenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categorie: form.categorie,
        montant: parseFloat(form.montant),
        description: form.description || null,
        date_depense: form.date_depense || null,
        projet_lie: form.projet_lie || null,
      }),
    });
    const json = await response.json();

    if (response.ok && json.data) {
      const created = json.data as Depense;
      if (photo) {
        const path = await uploadPhoto(photo, created.id);
        if (path) {
          await fetch(`/api/depenses/${created.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ justificatif_url: path }),
          });
          created.justificatif_url = path;
        }
      }
      setDepenses((current) => [created, ...current]);
      setForm(EMPTY_FORM);
      setPhoto(null);
      setShowForm(false);
    }

    setSaving(false);
  }

  function openEdit(depense: Depense) {
    setEditId(depense.id);
    setEditForm({
      categorie: depense.categorie,
      montant: String(depense.montant),
      description: depense.description ?? "",
      date_depense: depense.date_depense,
      projet_lie: depense.projet_lie ?? "",
    });
    setEditPhoto(null);
    setShowForm(false);
  }

  async function handleEdit(event: React.FormEvent) {
    event.preventDefault();
    if (!editId || !editForm.categorie || !editForm.montant) return;

    setEditSaving(true);
    const payload: Record<string, unknown> = {
      categorie: editForm.categorie,
      montant: parseFloat(editForm.montant),
      description: editForm.description || null,
      date_depense: editForm.date_depense || null,
      projet_lie: editForm.projet_lie || null,
    };

    if (editPhoto) {
      const path = await uploadPhoto(editPhoto, editId);
      if (path) payload.justificatif_url = path;
    }

    const response = await fetch(`/api/depenses/${editId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await response.json();

    if (response.ok) {
      setDepenses((current) => current.map((depense) => (depense.id === editId ? { ...depense, ...(json.data as Depense) } : depense)));
      setEditId(null);
      setEditPhoto(null);
    }

    setEditSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette dépense définitivement ?")) return;

    setDeletingId(id);
    const response = await fetch(`/api/depenses/${id}`, { method: "DELETE" });
    if (response.ok) setDepenses((current) => current.filter((depense) => depense.id !== id));
    setDeletingId(null);
  }

  async function viewJustificatif(path: string) {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase.storage.from("justificatifs").createSignedUrl(path, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  }

  const monthLabel = new Date().toLocaleDateString("fr-DZ", { month: "long", year: "numeric" });
  const linkedCount = depenses.filter((depense) => depense.projet_lie).length;
  const receiptCount = thisMonth.filter((depense) => depense.justificatif_url).length;
  const missingReceipts = Math.max(0, thisMonth.length - receiptCount);

  return (
    <>
      <style jsx global>{CSS}</style>
      <div className={`depenses-page ${showPagination && !isDesktop ? "has-mobile-pagination" : ""}`}>
        <header className="depenses-header">
          <motion.div className="depenses-header-top" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
            <div>
              <div className="depenses-kicker">Finance</div>
              <h1 className="depenses-title">Dépenses</h1>
              <p className="depenses-subtitle">
                {thisMonth.length} dépense{thisMonth.length !== 1 ? "s" : ""} ce mois-ci
                {isDesktop && totalThisMonth > 0 ? ` - ${formatMontant(totalThisMonth)} DZD` : ""}
              </p>
            </div>
            <motion.button
              className="depenses-add-btn"
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setShowForm((open) => !open);
                setEditId(null);
              }}
              aria-label={showForm ? "Fermer le formulaire" : "Nouvelle dépense"}
            >
              <Icon paths={showForm ? I.x : I.plus} size={17} />
              {isDesktop && <span>Nouvelle dépense</span>}
            </motion.button>
          </motion.div>

          <motion.div className="depenses-stats" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <article className="depenses-stat">
              <div className="depenses-stat-label">Total {monthLabel}</div>
              <div className="depenses-stat-value">
                {isDesktop ? formatMontant(totalThisMonth) : formatMontantCompact(totalThisMonth)}
                <small>DZD</small>
              </div>
              <div className="depenses-stat-note">
                {byCat[0] ? `${byCat[0].label} en catégorie principale` : "Aucune catégorie ce mois"}
              </div>
            </article>
            <article className="depenses-stat">
              <div className="depenses-stat-label">Total enregistrées</div>
              <div className="depenses-stat-value">
                {depenses.length}
                <small>dépenses</small>
              </div>
              <div className="depenses-stat-note">
                {linkedCount} liée{linkedCount !== 1 ? "s" : ""} à un projet
              </div>
            </article>
            <article className="depenses-stat">
              <div className="depenses-stat-label">Justificatifs</div>
              <div className="depenses-stat-value">
                {receiptCount}
                <small>/ {thisMonth.length}</small>
              </div>
              <div className="depenses-stat-note" style={{ color: missingReceipts === 0 && thisMonth.length > 0 ? "#3a7a50" : missingReceipts > 0 ? "#a8874e" : "#887f74" }}>
                {thisMonth.length === 0 ? "À vérifier plus tard" : missingReceipts === 0 ? "Tous fournis" : `${missingReceipts} manquant${missingReceipts > 1 ? "s" : ""}`}
              </div>
            </article>
          </motion.div>
        </header>

        <AnimatePresence>
          {showForm && (
            <motion.div
              key="add-form"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              style={{ overflow: "hidden", flexShrink: 0, borderBottom: "1px solid #e8e2d8", background: "#fbfaf7" }}
            >
              <div style={{ padding: "12px clamp(16px, 3vw, 40px)" }}>
                <div style={{ border: "1px solid #e8e2d8", borderRadius: 16, overflow: "hidden", background: "#ffffff", boxShadow: "0 16px 40px rgba(26,46,30,.07)" }}>
                  <div className="depenses-edit-title">Nouvelle dépense</div>
                  <DepenseForm
                    form={form}
                    onChange={setForm}
                    onSubmit={handleAdd}
                    onCancel={() => {
                      setShowForm(false);
                      setForm(EMPTY_FORM);
                      setPhoto(null);
                    }}
                    saving={saving}
                    photo={photo}
                    onPhoto={setPhoto}
                    soumissions={soumissions}
                    submitLabel="Enregistrer"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="depenses-content">
          <div className="depenses-tools">
            <div className="depenses-field">
              <Icon paths={I.search} size={15} />
              <input
                className="depenses-input"
                type="text"
                placeholder="Rechercher une dépense..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div style={{ position: "relative" }}>
              <select className="depenses-select" value={catFilter} onChange={(event) => setCatFilter(event.target.value as CategorieDepense | "")}>
                <option value="">Toutes catégories</option>
                {CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
              <SelectChevron />
            </div>
          </div>

          <section ref={gridRef} className="depenses-shell">
            {filtered.length === 0 ? (
              <div className="depenses-empty">
                <div className="depenses-empty-icon">
                  <Icon paths={I.file} size={24} />
                </div>
                <strong style={{ color: "#1a1714", fontSize: 15 }}>
                  {search || catFilter ? "Aucun résultat" : "Aucune dépense enregistrée"}
                </strong>
                <span style={{ marginTop: 5, fontSize: 13 }}>
                  {search || catFilter ? "Ajustez les filtres pour relancer la recherche." : "Ajoutez une dépense pour commencer le suivi."}
                </span>
              </div>
            ) : isDesktop ? (
              <div className="depenses-table-scroll">
                <div className="depenses-table">
                  <div className="depenses-table-head">
                    <div className="depenses-th">Description</div>
                    <div className="depenses-th">Projet</div>
                    <div className="depenses-th">Date</div>
                    <div className="depenses-th" style={{ justifyContent: "flex-end" }}>Montant</div>
                    <div className="depenses-th" style={{ justifyContent: "flex-end" }}>Actions</div>
                  </div>

                  <AnimatePresence>
                    {paginated.map((depense, index) => {
                      const project = soumissions.find((soumission) => soumission.id === depense.projet_lie);
                      const isEditing = editId === depense.id;

                      return (
                        <React.Fragment key={depense.id}>
                          <motion.div
                            className="depenses-table-row"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ delay: index * 0.02 }}
                          >
                            <div className="depenses-td" style={{ gap: 11 }}>
                              <CategoryBadge category={depense.categorie} />
                              <span className="depenses-desc">{depense.description || "Sans description"}</span>
                            </div>
                            <div className="depenses-td">
                              {project ? (
                                <span className="depenses-project">
                                  <Icon paths={I.project} size={13} stroke="#a8874e" />
                                  <span>{projectLabel(project)}</span>
                                </span>
                              ) : (
                                <span className="depenses-muted">Aucun projet lié</span>
                              )}
                            </div>
                            <div className="depenses-td">
                              <span className="depenses-muted">{formatDateShort(depense.date_depense)}</span>
                            </div>
                            <div className="depenses-td">
                              <span className="depenses-amount">
                                {formatMontant(Number(depense.montant))}
                                <small>DZD</small>
                              </span>
                            </div>
                            <div className="depenses-td">
                              <ExpenseActions
                                hasReceipt={Boolean(depense.justificatif_url)}
                                deleting={deletingId === depense.id}
                                onReceipt={() => depense.justificatif_url && viewJustificatif(depense.justificatif_url)}
                                onEdit={() => openEdit(depense)}
                                onDelete={() => handleDelete(depense.id)}
                              />
                            </div>
                          </motion.div>

                          <AnimatePresence>
                            {isEditing && (
                              <motion.div className="depenses-edit-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <div className="depenses-edit-title">Modifier la dépense</div>
                                <DepenseForm
                                  form={editForm}
                                  onChange={setEditForm}
                                  onSubmit={handleEdit}
                                  onCancel={() => {
                                    setEditId(null);
                                    setEditPhoto(null);
                                  }}
                                  saving={editSaving}
                                  photo={editPhoto}
                                  onPhoto={setEditPhoto}
                                  soumissions={soumissions}
                                  submitLabel="Enregistrer"
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </React.Fragment>
                      );
                    })}
                  </AnimatePresence>

                  {paginated.length < perPage && page === totalPages && (
                    <div className="depenses-history-end">Fin de l&apos;historique</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="depenses-card-list">
                <AnimatePresence>
                  {paginated.map((depense, index) => {
                    const project = soumissions.find((soumission) => soumission.id === depense.projet_lie);
                    const isEditing = editId === depense.id;

                    return (
                      <motion.article
                        key={depense.id}
                        className="depenses-card"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -12 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        {!isEditing ? (
                          <div className="depenses-card-body">
                            <div className="depenses-card-top">
                              <CategoryBadge category={depense.categorie} />
                              <span className="depenses-muted">{formatDateShort(depense.date_depense)}</span>
                            </div>

                            <div className="depenses-card-amount-row">
                              <span className="depenses-muted">Montant</span>
                              <span className="depenses-amount">
                                {formatMontant(Number(depense.montant))}
                                <small>DZD</small>
                              </span>
                            </div>

                            <div style={{ marginTop: 8, minWidth: 0 }}>
                              <div style={{ minWidth: 0 }}>
                                <p className="depenses-card-title">{depense.description || "Sans description"}</p>
                                {project ? (
                                  <span className="depenses-project">
                                    <Icon paths={I.project} size={13} stroke="#a8874e" />
                                    <span>{projectLabel(project)}</span>
                                  </span>
                                ) : (
                                  <span className="depenses-muted">Aucun projet lié</span>
                                )}
                              </div>
                            </div>

                            <div className="depenses-card-actions">
                              <ExpenseActions
                                hasReceipt={Boolean(depense.justificatif_url)}
                                deleting={deletingId === depense.id}
                                onReceipt={() => depense.justificatif_url && viewJustificatif(depense.justificatif_url)}
                                onEdit={() => openEdit(depense)}
                                onDelete={() => handleDelete(depense.id)}
                              />
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="depenses-edit-title">Modifier la dépense</div>
                            <DepenseForm
                              form={editForm}
                              onChange={setEditForm}
                              onSubmit={handleEdit}
                              onCancel={() => {
                                setEditId(null);
                                setEditPhoto(null);
                              }}
                              saving={editSaving}
                              photo={editPhoto}
                              onPhoto={setEditPhoto}
                              soumissions={soumissions}
                              submitLabel="Enregistrer"
                            />
                          </div>
                        )}
                      </motion.article>
                    );
                  })}
                </AnimatePresence>

                {paginated.length < perPage && page === totalPages && (
                  <div className="depenses-history-end">Fin de l&apos;historique</div>
                )}
              </div>
            )}
          </section>
        </main>

        {showPagination && (
          <footer className="depenses-pagination">
            <span className="depenses-page-count">
              {filtered.length} dépense{filtered.length !== 1 ? "s" : ""}
              {search || catFilter ? ` trouvée${filtered.length !== 1 ? "s" : ""}` : ""}
            </span>
            <div className="depenses-pager">
              <button className="depenses-page-btn" type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} aria-label="Page précédente">
                <Icon paths={I.chevronLeft} size={14} />
              </button>
              <span className="depenses-page-label">
                {page} / {totalPages}
              </span>
              <button className="depenses-page-btn" type="button" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)} aria-label="Page suivante">
                <Icon paths={I.chevronRight} size={14} />
              </button>
            </div>
            <span />
          </footer>
        )}
      </div>
    </>
  );
}
