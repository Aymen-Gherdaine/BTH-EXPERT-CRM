import { CardsPageSkeleton } from "@/components/ui/Skeleton";

// La page Soumissions s'ouvre en vue CARTES par défaut → skeleton cartes
// (3 KPIs admin). Évite le décalage table→cartes de l'ancien ListPageSkeleton.
export default function Loading() {
  return <CardsPageSkeleton kpis={3} count={9} />;
}
