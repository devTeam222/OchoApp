import Comment from "@/components/comments/Comment";
import CommentsLoadingSkeleton from "@/components/comments/CommentsLoadingSkeleton";
import Draggable from "@/components/Draggable";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { t } from "@/context/LanguageContext";
import kyInstance from "@/lib/ky";
import { CommentData, CommentsPage, RepliesPage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import ReplyInput from "./ReplyInput";
import Reply from "./Reply";

interface RepliesProps {
  comment: CommentData;
  onClose: () => void;
}

export default function Replies({ comment, onClose }: RepliesProps) {
  const [targetComment, setTargetComment] = useState<string | null>(null);
  const [isDraggable, setIsDraggable] = useState(false);
  const previousWidth = useRef(window.innerWidth);

  const {
    showPreviousComments,
    noComments,
    noLongerAvailablecomment,
    reply: replyText,
    replies: repliesText,
    dataError,
  } = t();

  const searchParams = useSearchParams();

  const { toast } = useToast();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["replies", comment.id],
    queryFn: ({ pageParam }) =>
      kyInstance
        .get(`/api/posts/comments/${comment.id}/replies`, {
          searchParams: new URLSearchParams({
            cursor: pageParam ? String(pageParam) : "",
            comment: targetComment ? String(targetComment) : "",
          }),
        })
        .json<RepliesPage>(),
    initialPageParam: null as string | null,
    getNextPageParam: (firstPage) => firstPage.previousCursor,
    select: (data) => ({
      pages: [...data.pages].reverse(),
      pageParams: [...data.pageParams].reverse(),
    }),
  });

  useEffect(() => {
    const handleResize = () => {
      setIsDraggable(window.innerWidth < 640); // Active draggable si largeur < 640px
    };

    handleResize(); // Vérifie la taille initiale
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const currentWidth = window.innerWidth;
      if (currentWidth !== previousWidth.current) {
        previousWidth.current = currentWidth;
        onClose(); // Appelle la fonction uniquement pour les redimensionnements horizontaux
      }
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const replies = data?.pages.flatMap((page) => page.replies) || [];

  useEffect(() => {
    if (status === "success" && comment) {
      setTargetComment(comment.id);
    }
    if (status === "error") {
      toast({
        variant: "destructive",
        description: dataError,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, comment, data]);

  if (comment.firstLevelCommentId) {
    return null;
  }

  return (
    <div className="relative w-[calc(100%-2rem)] overflow-y-auto border-s-4 border-solid border-s-primary bg-background sm:w-[calc(100%-2.5rem)]">
      <div className="w-full">
        {isFetchingNextPage && (
          <p className="w-full py-4 text-center text-muted-foreground max-sm:flex max-sm:items-center max-sm:justify-center">
            <Loader2 className="mx-auto my-3 animate-spin" />
          </p>
        )}
        {hasNextPage && (
          <Button
            variant="link"
            className="mx-auto block"
            disabled={isFetching}
            onClick={() => fetchNextPage()}
          >
            {showPreviousComments}
          </Button>
        )}
        {status === "pending" && (
          <Loader2 className="mx-auto my-3 animate-spin" />
        )}
        <div
          className={cn(
            "divide-y-2",
            (status === "pending" ||
              (status === "success" && !replies.length && !hasNextPage) ||
              status === "error") &&
              "hidden",
          )}
        >
          <div className="space-y-1 overflow-y-auto py-1 max-sm:bg-card/50">
            {replies.map((reply) => (
              <Reply
                key={reply.id}
                comment={reply}
                isTarget={
                  !!targetComment?.trim() && comment.id === targetComment
                }
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
