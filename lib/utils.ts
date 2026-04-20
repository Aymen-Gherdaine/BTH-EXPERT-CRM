import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateNumeroOffre(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  return `T${dd}${mm}${yyyy}`;
}

export function formatDateFr(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatMontant(amount: number): string {
  const [integer, decimal] = amount.toFixed(2).split(".");
  const formatted = integer.replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");
  return `${formatted},${decimal}`;
}

export function calcTotaux(lignes: { quantite: number; prix_unitaire: number }[]) {
  const total_ht = lignes.reduce(
    (sum, l) => sum + l.quantite * l.prix_unitaire,
    0
  );
  const tva = total_ht * 0.19;
  const total_ttc = total_ht + tva;
  return { total_ht, tva, total_ttc };
}
