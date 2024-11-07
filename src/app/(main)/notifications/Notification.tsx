import Time from "@/components/Time";
import UserAvatar from "@/components/UserAvatar";
import { NotificationData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { NotificationType } from "@prisma/client";
import { AtSign, Heart, MessageSquareMore, User2 } from "lucide-react";
import Link from "next/link";

interface NotificationProps {
  notification: NotificationData;
}

export default function Notification({ notification }: NotificationProps) {
  const notificationTypeMap: Record<
    NotificationType,
    {
      message: string;
      icon: JSX.Element;
      href: string;
    }
  > = {
    FOLLOW: {
      message: `a commencé à te suivre.`,
      icon: (
        <div className="absolute -bottom-0.5 -right-0.5 flex aspect-square items-center justify-center overflow-hidden rounded-full bg-foreground p-1">
          <User2 className="size-4 rounded-full fill-primary text-primary" />
        </div>
      ),
      href: `/users/${notification.issuer.username}`,
    },
    COMMENT: {
      message: `a commenté ${notification.comment?.content ? `"${notification.comment.content.slice(0, 30)}"` : "ton post"}.`,
      icon: (
        <div className="absolute -bottom-0.5 -right-0.5 flex aspect-square items-center justify-center rounded-full bg-foreground p-1">
          <MessageSquareMore className="size-4 fill-primary text-primary" />
        </div>
      ),
      href: `/posts/${notification.postId}${notification.commentId ? `?comment=${notification.commentId}` : ""}`,
    },
    LIKE: {
      message: `a aimé ton post.`,
      icon: (
        <div className="absolute -bottom-0.5 -right-0.5 flex aspect-square items-center justify-center rounded-full bg-foreground p-1">
          <Heart className="size-4 fill-red-500 text-red-500" />
        </div>
      ),
      href: `/posts/${notification.postId}`,
    },
    IDENTIFY: {
      message: `vous a identifié.`,
      icon: (
        <div className="absolute -bottom-0.5 -right-0.5 aspect-square max-h-10 max-w-10 rounded-full bg-foreground p-0.5 *:w-full">
          <AtSign className="size-5 text-yellow-500" />
        </div>
      ),
      href: `/posts/${notification.postId}`,
    },
  };

  const { message, icon, href } = notificationTypeMap[notification.type];

  return (
    <Link href={href} className="block">
      <article
        className={cn(
          "flex gap-3 bg-card/50 p-5 shadow-sm transition-colors hover:bg-card/70 sm:rounded-2xl sm:bg-card",
          !notification.read && "bg-accent",
        )}
      >
        <div className="flex gap-3 flex-shrink-0">
          <div className="relative w-fit h-fit">
            <UserAvatar avatarUrl={notification.issuer.avatarUrl} />
            {icon}
          </div>
          <div className="p-1 flex-1">
            <div className="line-clamp-3 overflow-hidden text-ellipsis w-full">
              <span className="font-bold max-w-40 overflow-hidden text-ellipsis">
                {notification.issuer.displayName}
              </span>{" "}{message}
            </div>
            <span className="text-muted-foreground">
              <Time time={notification.createdAt} long={false} relative/>
            </span>
          </div>
          {notification.post && (
            <div className="line-clamp-3 text-ellipsis whitespace-pre-line text-muted-foreground"></div>
          )}
        </div>
      </article>
    </Link>
  );
}
