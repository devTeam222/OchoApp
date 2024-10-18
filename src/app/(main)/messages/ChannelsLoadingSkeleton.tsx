import { Skeleton } from "@/components/ui/skeleton";

export default function ChannelsLoadingSkeleton() {
  return (
    <ul className="relative w-full animate-pulse divide-y-2">
      <ChannelSkeleton />
      <ChannelSkeleton />
      <ChannelSkeleton />
      <ChannelSkeleton />
      <ChannelSkeleton />
      <ChannelSkeleton />
      <ChannelSkeleton />
      <ChannelSkeleton />
      <ChannelSkeleton />
      <ChannelSkeleton />
    </ul>
  );
}

function ChannelSkeleton() {
  return (
    <li className="w-full p-2">
      <div className="flex w-full items-center space-x-2">
        <Skeleton className="h-11 w-11 rounded-full bg-muted-foreground/30" />
        <div className="relative flex-1 space-y-1">
          <Skeleton className="h-4 w-[60%] max-w-32 rounded bg-muted-foreground/30" />
          <Skeleton className="h-3 w-[80%] max-w-40 rounded bg-muted-foreground/30" />
        </div>
      </div>
    </li>
  );
}
