"use client";

import { Button } from "@/components/ui/button";
import kyInstance from "@/lib/ky";
import { NotificationCountInfo } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import Link from "next/link";

interface NotificationsButtonProps {
  initialState: NotificationCountInfo;
}

export default function NotificationsButton({
  initialState,
}: NotificationsButtonProps) {
  const isProduction = process.env.NODE_ENV === "production";

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
      variant="ghost"
      className="flex items-center justify-start max-sm:h-fit sm:gap-3 max-sm:p-1.5"
      title="Notifications"
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
        <span className="text-xs sm:hidden">Activités</span>
        <span className="max-lg:hidden">Notifications</span>
      </Link>
    </Button>
  );
}
