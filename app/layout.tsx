import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Police variable : un seul fichier woff2 couvre tout l'axe de graisse
// (100→900), au lieu de 7 fichiers statiques. Gère nativement les poids
// non-standard utilisés par le design (650 / 750 / 850), impossibles à
// rendre correctement avec des instances statiques.
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "BTH Hub",
  icons: {
    icon: "/icon.svg",
  },
  description: "BTH Hub — Gestion des offres",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={inter.variable}>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
