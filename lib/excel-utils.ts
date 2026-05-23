import type { WorkSheet } from "xlsx";

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
