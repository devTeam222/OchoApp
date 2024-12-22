"use client";

import { Button, ButtonProps } from "@/components/ui/button";
import { t } from "@/context/LanguageContext";
import kyInstance from "@/lib/ky";
import { NotificationCountInfo } from "@/lib/types";
import { cn } from "@/lib/utils";
import { VocabularyKey } from "@/lib/vocabulary";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import Link from "next/link";

interface NotificationsButtonProps extends ButtonProps {
  initialState: NotificationCountInfo;
  className?: string;
}

export default function NotificationsButton({
  initialState,
  className,
  ...props
}: NotificationsButtonProps) {
  const isProduction = process.env.NODE_ENV === "production";

  const vocabulary: VocabularyKey[] = ["activity", "activityCenter", "notifications"];

  const { activity, activityCenter, notifications } = t(vocabulary);

  const { data } = useQuery({
    queryKey: ["unread-notifications"],
    queryFn: () =>
      kyInstance
        .get("/api/notifications/unread-count")
        .json<NotificationCountInfo>(),
    initialData: initialState,
    refetchInterval: isProduction ? 45 * 1000 : 50 * 1000,
  });

  return (
    <Button
      {...props}
      variant="ghost"
      className={cn(
        "flex items-center justify-start max-sm:h-fit max-sm:flex-1 max-sm:p-1.5 sm:gap-3",
        className,
      )}
      title={activityCenter}
      asChild
    >
      <Link
        href="/notifications"
        className="items-center max-sm:flex max-sm:flex-col"
      >
        <div className="relative">
          <Bell />
          {!!data.unreadCount && (
            <span className="absolute -right-1 -top-1 rounded-full bg-primary px-1 text-xs font-medium tabular-nums text-primary-foreground">
              {data.unreadCount}
            </span>
          )}
        </div>
        <span className="text-xs sm:hidden">{activity}</span>
        <span className="max-lg:hidden">{notifications}</span>
      </Link>
    </Button>
  );
}
