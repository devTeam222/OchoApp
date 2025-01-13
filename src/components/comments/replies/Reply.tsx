import { useSession } from "@/app/(main)/SessionProvider";
import Linkify from "@/components/Linkify";
import Time from "@/components/Time";
import OchoLink from "@/components/ui/OchoLink";
import UserAvatar from "@/components/UserAvatar";
import UserTooltip from "@/components/UserTooltip";
import { CommentData } from "@/lib/types";
import { cn } from "@/lib/utils";
import CommentMoreButton from "../CommentMoreButton";
import LikeButton from "./LikeButton";
import ReplyButton from "./ReplyButton";
import ReplyInput from "./ReplyInput";
import { useState } from "react";


interface CommentProps {
  comment: CommentData;
  isTarget?: boolean;
}

export default function Reply({ comment, isTarget = false }: CommentProps) {
  const { user } = useSession();
  const [showInput, setShowInput] = useState(false);

  return (
    <div
      className={cn(
        "group/comment flex flex-shrink-0 flex-col items-end px-2 py-3 transition-all *:flex-shrink-0 sm:rounded-sm",
          isTarget &&
            "p-s-4 border-solid border-s-primary bg-primary/10 sm:border-4 sm:border-primary/50",
      )}
    >
      <div
        className={cn(
          "flex w-full gap-3"
        )}
      >
        <UserTooltip user={comment.user}>
          <span>
            <OchoLink
              href={`users/${comment.user.username}`}
              className="max-sm:hidden"
            >
              <UserAvatar avatarUrl={comment.user.avatarUrl} size={32} />
            </OchoLink>
            <span className="sm:hidden">
              <UserAvatar avatarUrl={comment.user.avatarUrl} size={32} />
            </span>
          </span>
        </UserTooltip>
        <div className="relative flex-1">
          <div className="flex w-full justify-between">
            <div className="flex-1 items-center gap-1 text-sm text-muted-foreground">
              <UserTooltip user={comment.user}>
                <div className="items-center">
                  <OchoLink
                    href={`users/${comment.user.username}`}
                    className="font-medium text-inherit max-sm:hidden"
                  >
                    {comment.user.displayName}
                  </OchoLink>
                  <span className="font-medium hover:underline sm:hidden">
                    {comment.user.displayName}
                  </span>
                </div>
              </UserTooltip>
            </div>
            {comment.user.id === user.id && (
              <CommentMoreButton
                comment={comment}
                className="absolute right-0 top-0 opacity-0 transition-opacity group-hover/comment:opacity-100 max-sm:opacity-100"
              />
            )}
          </div>
          <Linkify postId={comment.postId}>
            <p>{comment.content}</p>
          </Linkify>
          <div className="">
            <span className="text-xs text-muted-foreground">
              <Time time={comment.createdAt} long />
            </span>
          </div>
          <div className="flex w-full gap-2">
            <LikeButton
              commentId={comment.id}
              initialState={{
                likes: comment._count.likes,
                isLikedByUser: comment.likes.some(
                  (like) => like.userId === user.id,
                ),
              }}
            />
            <ReplyButton replies={comment._count.replies} onClick={() => setShowInput(true)} />
          </div>
        </div>
      </div>
      {showInput && <ReplyInput comment={comment} onClose={()=>setShowInput(false)}/>}
    </div>
  );
}
