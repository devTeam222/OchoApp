import { Skeleton } from "../ui/skeleton";

export default function PostsLoadingSkeleton() {
    return (
        <div className="space-y-5">
            <PostLoadingSkeleton/>
            <PostLoadingSkeleton/>
            <PostLoadingSkeleton/>
        </div>
    )
}

function PostLoadingSkeleton() {
  return (
    <div className="w-full animate-pulse space-y-3 rounded-2xl bg-card p-5 shadow-sm">
      <div className="flex flex-wrap gap-3">
        <Skeleton className="size-12 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-4 w-20 rounded" />
        </div>
      </div>
          <Skeleton className="h-6 w-72 rounded" />
          <Skeleton className="h-6 w-52 rounded" />
      <div className="grid grid-cols-2 gap-2">
          <Skeleton className="aspect-square rounded-2xl" />
          <Skeleton className="aspect-square rounded-2xl" />
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-6 w-12 rounded" />
        <Skeleton className="h-6 w-6 rounded" />
      </div>
    </div>
  );
}
