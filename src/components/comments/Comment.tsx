import { CommentData } from "@/lib/types";
import Linkify from "../Linkify";
import UserTooltip from "../UserTooltip";
import OchoLink from "@/components/ui/OchoLink";
import UserAvatar from "../UserAvatar";
import Time from "../Time";
import { useSession } from "@/app/(main)/SessionProvider";
import CommentMoreButton from "./CommentMoreButton";
import { cn } from "@/lib/utils";
import LikeButton from "./replies/LikeButton";
import ReplyButton from "./replies/ReplyButton";
import Replies from "./replies/Replies";
import ReplyInput from "./replies/ReplyInput";
import { useState } from "react";
import { t } from "@/context/LanguageContext";
import { Button } from "../ui/button";
import { Heart, MessageSquare } from "lucide-react";

interface CommentProps {
  comment: CommentData & { isRepliedByAuthor?: boolean };
  isTarget?: boolean;
}

export default function Comment({ comment, isTarget = false }: CommentProps) {
  const { user } = useSession();
  const [showInput, setShowInput] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [repliesCount, setRepliesCount] = useState(comment._count.firstLevelOf);
  const [authorReplied, setAuthorReplied] = useState(comment.isRepliedByAuthor);
  const [authorLiked, setAuthorLiked] = useState(false);

  return (
    <div
      className={cn(
        "group/comment flex flex-shrink-0 flex-col items-end gap-2 bg-background/30 px-2 py-3 transition-all *:flex-shrink-0 sm:rounded-sm",
      )}
    >
      <div
        className={cn(
          "flex w-full gap-3",
          isTarget &&
            "border-s-4 border-solid border-s-primary bg-primary/10 sm:border-4 sm:border-primary/50",
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
          <div className="flex w-full items-center gap-4">
            <LikeButton
              comment={comment}
              initialState={{
                likes: comment._count.likes,
                isLikedByUser: comment.likes.some(
                  (like) => like.userId === user.id,
                ),
                isLikedByAuthor: comment.likes.some(
                  (like) => like.userId === comment.post.userId,
                ),
              }}
              onAuthorLikeChange={setAuthorLiked}
            />
            <ReplyButton
              replies={repliesCount}
              onClick={() => setShowInput(true)}
            />
            {authorLiked && (
              <AuthorLikeIcon avatarUrl={comment.post.user.avatarUrl} />
            )}
          </div>
        </div>
      </div>
      {showInput && (
        <ReplyInput
          comment={{
            ...comment,
            firstLevelComment: comment,
          }}
          onClose={() => setShowInput(false)}
        />
      )}
      <div className="flex w-[calc(100%-2rem)] items-center gap-2 sm:w-[calc(100%-2.5rem)]">
        {authorReplied && (
          <>
            <AuthorReplyIcon avatarUrl={comment.post.user.avatarUrl} />
            <span className="text-xl font-bold text-primary">•</span>
          </>
        )}
        {!comment.firstLevelCommentId && (
          <ShowRepliesButton
            replies={repliesCount}
            onClick={() => setShowReplies(!showReplies)}
          />
        )}
      </div>
      {(showReplies || showInput) && (
        <Replies
          comment={comment}
          onClose={() => setShowReplies(false)}
          onCountChange={setRepliesCount}
          onAuthorReplyChange={setAuthorReplied}
        />
      )}
    </div>
  );
}

export function AuthorReplyIcon({ avatarUrl }: { avatarUrl: string | null }) {
  return (
    <span className="relative">
      <UserAvatar avatarUrl={avatarUrl} size={32} />
      <MessageSquare
        size={20}
        className="absolute -bottom-1 -right-0.5 fill-primary"
      />
    </span>
  );
}
export function AuthorLikeIcon({ avatarUrl }: { avatarUrl: string | null }) {
  return (
    <span className="relative border-border">
      <UserAvatar avatarUrl={avatarUrl} size={28} />
      <Heart size={20} className="absolute -bottom-1 -right-0.5 fill-red-500" />
    </span>
  );
}

export function ShowRepliesButton({
  replies,
  onClick,
}: {
  replies: number;
  onClick: () => void;
}) {
  const { replies: repliesText, reply: replyText } = t();
  if (!replies) {
    return null;
  }
  return (
    <Button
      title={repliesText}
      onClick={onClick}
      className="flex items-center gap-2 bg-accent text-primary hover:text-primary"
      variant="ghost"
    >
      <span className="text-sm font-medium tabular-nums">
        {replies}{" "}
        <span className="">{replies > 1 ? repliesText : replyText}</span>
      </span>
    </Button>
  );
}
