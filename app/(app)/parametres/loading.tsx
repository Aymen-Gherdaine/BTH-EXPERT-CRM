import PageSkeleton from "@/components/ui/PageSkeleton";

export default function Loading() {
  return <PageSkeleton stats={0} rows={5} search={false} />;
}
