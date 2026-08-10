import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="container-x py-14">
      <Skeleton className="h-10 w-2/3 max-w-md" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    </div>
  );
}
