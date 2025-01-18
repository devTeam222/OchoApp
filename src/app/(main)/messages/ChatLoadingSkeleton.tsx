import { Skeleton } from "@/components/ui/skeleton";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";
import { ArrowLeft } from "lucide-react";

interface ChatLoadingSkeletonProps{
  onChatClose?: ()=>void
}

export default function ChatLoadingSkeleton({
  onChatClose
}: ChatLoadingSkeletonProps) {
  return (
    <div className="absolute flex h-full w-full flex-1 flex-col max-sm:bg-card/30">
      <div className="flex w-full items-center gap-2 px-4 py-3 max-sm:bg-card/50 flex-shrink-0 *:flex-shrink-0">
        <div
          className="cursor-pointer sm:hidden"
          onClick={onChatClose}
        >
          <ArrowLeft size={35} />
        </div>
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex flex-col gap-2 w-full">
            <Skeleton className="h-3 w-60 max-w-full" />
            <Skeleton className="h-2 w-20 max-w-full" />
        </div>
      </div>
      <div className="relative flex flex-1 flex-col-reverse space-y-4 overflow-y-auto overflow-x-hidden px-2 py-4 shadow-inner scrollbar-track-primary scrollbar-track-rounded-full sm:bg-background/50">
        <MessagesLoadingSkeleton />
      </div>
      <div className="flex w-full items-center gap-2 px-4 py-3 max-sm:bg-card/50 flex-shrink-0 *:flex-shrink-0">
        <Skeleton className="h-10 w-full rounded-3xl"/>
      </div>
    </div>
  );
}
