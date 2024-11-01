import { CommentsPage, PostData } from "@/lib/types";
import CommentInput from "./CommentInput";
import { useInfiniteQuery } from "@tanstack/react-query";
import kyInstance from "@/lib/ky";
import CommentsLoadingSkeleton from "./CommentsLoadingSkeleton";
import Comment from "./Comment";
import { Button } from "../ui/button";
import { Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "../ui/use-toast";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface CommentsProps {
  post: PostData;
  onClose: () => void;
}

export default function Comments({ post, onClose }: CommentsProps) {
  const [targetComment, setTargetComment] = useState<string | null>(null);
  const router = useRouter();

  const searchParams = useSearchParams();
  const comment = searchParams.get("comment");
  
  const { toast } = useToast();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["comments", post.id],
    queryFn: ({ pageParam }) =>
      kyInstance
        .get(`/api/posts/${post.id}/comments`, {
          searchParams: new URLSearchParams({
            cursor: pageParam ? String(pageParam) : "",
            comment: targetComment ? String(targetComment) : "",
          }),
        })
        .json<CommentsPage>(),
    initialPageParam: null as string | null,
    getNextPageParam: (firstPage) => firstPage.previousCursor,
    select: (data) => ({
      pages: [...data.pages].reverse(),
      pageParams: [...data.pageParams].reverse(),
    }),
  });

  const comments = data?.pages.flatMap((page) => page.comments) || [];

  
  useEffect(() => {
    if (
      status === "success" &&
      comment &&
      !comments.find((c) => c.id === comment)
    ) {
      toast({
        variant: "destructive",
        description: "Le commentaire n'est plus diaponible",
      });
      router.push(`/posts/${post.id}`);
      onClose();
    }
    if (
      status === "success" &&
      comment &&
      comments.find((c) => c.id === comment)
    ) {
      setTargetComment(comment);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, comment, data, comments]);

  return (
    <div className="bottom-0 left-0 space-y-3 max-sm:fixed max-sm:z-10 max-sm:flex max-sm:w-full max-sm:animate-appear-b max-sm:flex-col-reverse max-sm:rounded-e-sm max-sm:rounded-s-sm max-sm:bg-card max-sm:pt-2">
      <CommentInput post={post} />
      {isFetchingNextPage && <Loader2 className="mx-auto my-3 animate-spin" />}
      {hasNextPage && (
        <Button
          variant="link"
          className="mx-auto block"
          disabled={isFetching}
          onClick={() => fetchNextPage()}
        >
          Afficher les commentaires precedents
        </Button>
      )}
      {status === "pending" && <CommentsLoadingSkeleton />}
      {status === "success" && !comments.length && !hasNextPage && (
        <p className="w-full py-4 text-center text-muted-foreground max-sm:flex max-sm:h-[50vh] max-sm:items-center max-sm:justify-center">
          Aucun commentaire à afficher
        </p>
      )}
      {status === "error" && (
        <p className="w-full py-4 text-center text-muted-foreground max-sm:flex max-sm:h-[50vh] max-sm:items-center max-sm:justify-center">
          Quelque chose s&apos;est mal passé
        </p>
      )}
      <div
        className={cn(
          "divide-y-2",
          (status === "pending" ||
            (status === "success" && !comments.length && !hasNextPage) ||
            status === "error") &&
            "hidden",
        )}
      >
        <div className="relative top-0 flex w-full items-center justify-between px-3 py-2 font-bold sm:hidden">
          {status === "success" && !!comments.length && (
            <p>{`${comments.length} commentaire${comments.length > 1 ? "s" : ""}`}</p>
          )}
          <div className="" onClick={onClose}>
            <X />
          </div>
        </div>
        <div className="overflow-y-auto max-sm:h-[50vh]">
          {comments.map((comment) => (
            <Comment
              key={comment.id}
              comment={comment}
              isTarget={!!targetComment?.trim() && comment.id === targetComment}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
