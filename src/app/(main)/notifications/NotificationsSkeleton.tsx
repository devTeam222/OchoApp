import { Skeleton } from "@/components/ui/skeleton";

export default function NotificationsSkeleton() {
  return (
    <div className="space-y-2 sm:space-y-5">
      <NotificationSkeleton />
      <NotificationSkeleton />
      <NotificationSkeleton />
    </div>
  );
}

function NotificationSkeleton() {
  return (
    <div>
      <article className="flex gap-3 bg-card/50 p-5 shadow-sm transition-colors hover:bg-card/70 sm:rounded-2xl sm:bg-card">
        <div className="my-1">
          <Skeleton className="size-7 rounded-full" />
        </div>
        <div className="w-full space-y-3">
          <Skeleton className="aspect-square size-12 h-fit flex-none rounded-full" />
          <div>
            <Skeleton className="h-4 w-40 rounded" />
          </div>
          <Skeleton className="h-10 w-full rounded" />
        </div>
      </article>
    </div>
  );
}
