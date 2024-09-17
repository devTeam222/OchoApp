import { Skeleton } from "@/components/ui/skeleton";

export default function NotificationsSkeleton() {
  return (
    <>
      <NotificationSkeleton />
      <NotificationSkeleton />
      <NotificationSkeleton />
    </>
  );
}

function NotificationSkeleton() {
  return (
    <div>
      <article className="flex gap-3 rounded-2xl bg-card p-5 shadow-sm transition-colors hover:bg-card/70">
        <div className="my-1">
          <Skeleton className="size-7 rounded-full" />
        </div>
        <div className="space-y-3 w-full">
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
