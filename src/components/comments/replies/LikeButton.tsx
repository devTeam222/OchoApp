import { LikeInfo } from "@/lib/types";
import { useToast } from "../../ui/use-toast";
import {
  QueryKey,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import kyInstance from "@/lib/ky";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/context/LanguageContext";

interface LikeButtonProps {
  commentId: string;
  initialState: LikeInfo;
}

export default function LikeButton({ commentId, initialState }: LikeButtonProps) {
  const { toast } = useToast();
  const { like: likeText, likes: likesText, unLike, somethingWentWrong } = t();

  const queryClient = useQueryClient();

  const queryKey: QueryKey = ["like-info", commentId];

  const { data } = useQuery({
    queryKey,
    queryFn: () =>
      kyInstance.get(`/api/posts/comments/${commentId}/likes`).json<LikeInfo>(),
    initialData: initialState,
    staleTime: Infinity,
  });

  const { mutate } = useMutation({
    mutationFn: () =>
      data.isLikedByUser
        ? kyInstance.delete(`/api/posts/comments/${commentId}/likes`)
        : kyInstance.post(`/api/posts/comments/${commentId}/likes`),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });

      const previousState = queryClient.getQueryData<LikeInfo>(queryKey);

      queryClient.setQueryData<LikeInfo>(queryKey, () => ({
        likes:
          (previousState?.likes || 0) + (previousState?.isLikedByUser ? -1 : 1),
        isLikedByUser: !previousState?.isLikedByUser,
      }));

      return { previousState };
    },
    onError(error, variable, context) {
      queryClient.setQueryData(queryKey, context?.previousState);
      console.error(error);
      toast({
        variant: "destructive",
        description: somethingWentWrong,
      });
    },
  });

  return (
    <button
      title={data.isLikedByUser ? unLike : likeText}
      onClick={() => mutate()}
      className="flex items-center gap-1"
    >
      <Heart
        className={cn(
          "size-5",
          data.isLikedByUser && "fill-red-500 text-red-500",
        )}
      />
    </button>
  );
}