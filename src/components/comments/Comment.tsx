import { CommentData } from "@/lib/types";
import Linkify from "../Linkify";
import UserTooltip from "../UserTooltip";
import Link from "next/link";
import UserAvatar from "../UserAvatar";
import Time from "../Time";
import { useSession } from "@/app/(main)/SessionProvider";
import CommentMoreButton from "./CommentMoreButton";

interface CommentProps {
  comment: CommentData;
}

export default function Comment({ comment }: CommentProps) {
  const { user } = useSession();

  return (
    <div className="group/comment flex gap-3 py-3">
        <UserTooltip user={comment.user}>
          <span>
            <Link
              href={`users/${comment.user.username}`}
              className="hidden sm:inline"
            >
              <UserAvatar avatarUrl={comment.user.avatarUrl} size={40} />
            </Link>
            <span className="sm:hidden">
              <UserAvatar avatarUrl={comment.user.avatarUrl} size={32} />
            </span>
          </span>
        </UserTooltip>
      <div className="flex-1">
        <div className="flex w-full justify-between">
            <div className="items-center gap-1 text-sm flex-1">
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
              <span className="text-muted-foreground">
                <Time time={comment.createdAt} />
              </span>
            </div>
            {comment.user.id === user.id && (
              <CommentMoreButton
                comment={comment}
                className="opacity-0 transition-opacity group-hover/comment:opacity-100 max-sm:opacity-100"
              />
            )}
        </div>
          <Linkify postId={comment.postId}>
            <p>{comment.content}</p>
          </Linkify>
      </div>
    </div>
  );
}
