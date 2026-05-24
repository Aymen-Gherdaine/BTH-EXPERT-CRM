import * as XLSX from "xlsx-js-style";
import type { WorkSheet } from "xlsx-js-style";

const HEADER_BG = "1A2E1E"; // bth-green-800
const HEADER_FG = "FFFFFF";

export function autoFitColumns(
  worksheet: WorkSheet,
  rows: Record<string, unknown>[]
): void {
  if (rows.length === 0) return;

  const headers = Object.keys(rows[0]);

  const colWidths = headers.map(header => {
    const headerWidth = header.length + 4;

    const maxDataWidth = rows.reduce((max, row) => {
      const val = row[header];
      const len = val != null ? String(val).length : 0;
      return Math.max(max, len);
    }, 0) + 4;

    return { wch: Math.max(headerWidth, maxDataWidth, 10) };
  });

  worksheet["!cols"] = colWidths;
}

export function styleHeaders(worksheet: WorkSheet, headers: string[]): void {
  headers.forEach((_, colIdx) => {
    const cellAddr = XLSX.utils.encode_cell({ r: 0, c: colIdx });
    const cell = worksheet[cellAddr];
    if (!cell) return;
    cell.s = {
      fill: { patternType: "solid", fgColor: { rgb: HEADER_BG } },
      font: { bold: true, color: { rgb: HEADER_FG } },
      alignment: { vertical: "center", horizontal: "center" },
    };
  });
  if (!worksheet["!rows"]) worksheet["!rows"] = [];
  (worksheet["!rows"] as { hpt?: number }[])[0] = { hpt: 22 };
}
