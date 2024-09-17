import { CommentsPage, PostData } from "@/lib/types";
import CommentInput from "./CommentInput";
import { useInfiniteQuery } from "@tanstack/react-query";
import kyInstance from "@/lib/ky";
import CommentsLoadingSkeleton from "./CommentsLoadingSkeleton";
import Comment from "./Comment";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";

interface CommentsProps {
  post: PostData;
}

export default function Comments({ post }: CommentsProps) {
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
        .get(
          `/api/posts/${post.id}/comments`,
          pageParam ? { searchParams: { cursor: pageParam } } : {},
        )
        .json<CommentsPage>(),
    initialPageParam: null as string | null,
    getNextPageParam: (firstPage) => firstPage.previousCursor,
    select: (data) => ({
      pages: [...data.pages].reverse(),
      pageParams: [...data.pageParams].reverse(),
    }),
  });

  const comments = data?.pages.flatMap((page) => page.comments) || [];

  return (
    <div className="space-y-3">
      <CommentInput post={post}/>
      {isFetchingNextPage && <Loader2 className="mx-auto my-3 animate-spin"/>}
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
      <div className="divide-y-2">
        {status === "pending" && <CommentsLoadingSkeleton />}
        {status === "success" && !comments.length && !hasNextPage && (
          <p className="w-full text-center text-muted-foreground py-4">
            Aucun commentaire à afficher
          </p>
        )}
        {status === "error" && (
          <p className="w-full text-center text-destructive py-4">
            Erreur lors de la récupération des commentaires
          </p>
        )}
        {comments.map((comment) => (
          <Comment key={comment.id} comment={comment} />
        ))}
      </div>
    </div>
  );
}
