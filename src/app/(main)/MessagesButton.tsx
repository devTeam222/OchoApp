"use client";

import { Button, ButtonProps } from "@/components/ui/button";
import kyInstance from "@/lib/ky";
import { NotificationCountInfo } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { MessageSquareMore } from "lucide-react";
import Link from "next/link";

interface MessagesButtonProps extends ButtonProps {
  initialState: NotificationCountInfo;
  className?: string;
}

export default function MessagesButton({
  initialState,
  className,
  ...props
}: MessagesButtonProps) {
  const isProduction = process.env.NODE_ENV === "production";

  const { data } = useQuery({
    queryKey: ["unread-messages"],
    queryFn: () =>
      kyInstance
        .get("/api/messages/unread-count")
        .json<NotificationCountInfo>(),
    initialData: initialState,
    refetchInterval: isProduction ? 45 * 1000 : 50 * 1000,
  });

  const { unreadCount } = data;

  return (
    <Button
      {...props}
      variant="ghost"
      className={cn(
        "flex items-center justify-start max-sm:h-fit max-sm:p-1.5 sm:gap-3",
        className,
      )}
      title="Messages"
      asChild
    >
      <Link
        href="/messages"
        className="items-center max-sm:flex max-sm:flex-col"
      >
        <div className="relative">
          <MessageSquareMore />
          {!!unreadCount && (
            <span className="absolute -right-1 -top-1 rounded-full bg-primary px-1 text-xs font-medium tabular-nums text-primary-foreground">
              {unreadCount > 9 ? "9+": unreadCount}
            </span>
          )}
        </div>
        <span className="text-xs sm:hidden">Messages</span>
        <span className="max-lg:hidden">Messages</span>
      </Link>
    </Button>
  );
}
