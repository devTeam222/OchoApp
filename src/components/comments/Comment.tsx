import { CommentData } from "@/lib/types";
import Linkify from "../Linkify";
import UserTooltip from "../UserTooltip";
import Link from "next/link";
import UserAvatar from "../UserAvatar";
import Time from "../Time";
import { useSession } from "@/app/(main)/SessionProvider";
import CommentMoreButton from "./CommentMoreButton";
import { cn } from "@/lib/utils";

interface CommentProps {
  comment: CommentData;
  isTarget?: boolean;
}

export default function Comment({ comment, isTarget = false }: CommentProps) {
  const { user } = useSession();

  return (
    <div
      className={cn(
      "group/comment flex gap-3 sm:rounded-sm px-2 py-3 transition-all bg-background/30",
        isTarget && "bg-primary/10 border-solid border-s-primary border-s-4 sm:border-primary/50 sm:border-4",
      )}
    >
      <UserTooltip user={comment.user}>
        <span>
          <Link
            href={`users/${comment.user.username}`}
            className="hidden sm:inline"
          >
            <UserAvatar avatarUrl={comment.user.avatarUrl} size={32} />
          </Link>
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
                <Link
                  href={`users/${comment.user.username}`}
                  className="hidden font-medium hover:underline sm:inline"
                >
                  {comment.user.displayName}
                </Link>
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
          <span className="text-muted-foreground text-xs">
            <Time time={comment.createdAt} long />
          </span>
        </div>
      </div>
    </div>
  );
}
