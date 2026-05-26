import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateNumeroOffre(): string {
  const now = new Date();
  const day   = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year  = now.getFullYear();
  const rand  = Math.floor(Math.random() * 9000) + 1000;
  return `T${day}${month}${year}-${rand}`;
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
