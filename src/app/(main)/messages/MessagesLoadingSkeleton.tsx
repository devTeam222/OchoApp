import { Skeleton } from "@/components/ui/skeleton";

interface MessageLoadingSkeletonProps {
  sender: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

export default function MessagesLoadingSkeleton() {
  return (
    <div className="relative flex h-full animate-pulse flex-col-reverse gap-2 space-y-3 overflow-y-auto p-2 sm:bg-background/50">
      <MessageLoadingSkeleton sender={false} size="md" />
      <MessageLoadingSkeleton sender={true} size="lg" />
      <MessageLoadingSkeleton sender={false} size="sm" />
      <MessageLoadingSkeleton sender={false} size="lg" />
      <MessageLoadingSkeleton sender={false} size="xl" />
    </div>
  );
}

function MessageLoadingSkeleton({
  sender,
  size = "md",
}: MessageLoadingSkeletonProps) {
  const sizes = {
    sm: "h-16 w-[35%]",
    md: "h-20 w-[45%]",
    lg: "h-24 w-[65%]",
    xl: "h-28 w-[75%]",
  };
  const sizeClass = sizes[size];

  return (
    <div className={`flex w-full gap-2 ${sender ? "flex-row-reverse" : ""}`}>
      {!sender && (
        <span className="py-1">
          <Skeleton className="h h-[18px] w-[18px] rounded-full  bg-muted-foreground/20" />
        </span>
      )}
      <div
        className={"relative w-full" + ` ${sender && "flex flex-row-reverse"}`}
      >
        {!sender && (
          <div className="pb-1 ps-2">
            <Skeleton className="h-[14px] w-14 rounded  bg-muted-foreground/20" />
          </div>
        )}
        <Skeleton
          className={"rounded-3xl px-4 py-2  bg-muted-foreground/20" + ` ${sizeClass}`}
        ></Skeleton>
      </div>
    </div>
  );
}
