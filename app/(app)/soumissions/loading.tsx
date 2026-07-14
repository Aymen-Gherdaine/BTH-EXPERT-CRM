import { ListPageSkeleton } from "@/components/ui/Skeleton";

// Système unifié : tableau (desktop) / cartes (mobile), comme Clients / Dépenses.
export default function Loading() {
  return <ListPageSkeleton kpis={3} rows={10} cards={9} />;
}
