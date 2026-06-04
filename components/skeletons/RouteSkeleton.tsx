"use client";

import { usePathname } from "next/navigation";
import ClientsSkeleton from "./ClientsSkeleton";
import DashboardSkeleton from "./DashboardSkeleton";
import SoumissionsSkeleton from "./SoumissionsSkeleton";
import ProspectionSkeleton from "./ProspectionSkeleton";
import DepensesSkeleton from "./DepensesSkeleton";
import GenericSkeleton from "./GenericSkeleton";

/**
 * Fallback de Suspense pour le layout (app). Affiché UNIQUEMENT au premier
 * rendu (cold load) : React garde la page précédente pendant les transitions
 * de navigation, donc ce skeleton ne réapparaît PAS d'un onglet à l'autre.
 * Choisit le skeleton pixel-perfect en fonction de l'URL courante.
 */
export default function RouteSkeleton() {
  const pathname = usePathname() || "";

  if (pathname.startsWith("/clients")) return <ClientsSkeleton />;
  if (pathname.startsWith("/dashboard")) return <DashboardSkeleton />;
  if (pathname.startsWith("/soumissions")) return <SoumissionsSkeleton />;
  if (pathname.startsWith("/prospection")) return <ProspectionSkeleton />;
  if (pathname.startsWith("/depenses")) return <DepensesSkeleton />;
  return <GenericSkeleton />;
}
