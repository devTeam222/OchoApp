"use client";

import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";
import kyInstance from "@/lib/ky";
import { NotificationsPage } from "@/lib/types";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import Notification from "./Notification";
import { useEffect } from "react";
import NotificationsSkeleton from "./NotificationsSkeleton";

export default function Notifications() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["notifications"],
    queryFn: ({ pageParam }) =>
      kyInstance
        .get(
          "/api/notifications",
          pageParam ? { searchParams: { cursor: pageParam } } : {},
        )
        .json<NotificationsPage>(),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const queryClient = useQueryClient();

  const {mutate} = useMutation({
    mutationFn: ()=> kyInstance.patch("/api/notifications/mark-as-read"),
    onSuccess: ()=>{
      queryClient.setQueryData(["unread-notifications"], {
        unreadCount: 0
      })
    },
    onError(error) {
        console.error("Impossible de marquer comme lu.", error);
    },
  });

  useEffect(()=>{
    mutate()
  }, [mutate])

  const notifications = data?.pages.flatMap((page) => page.notifications) || [];

  if (status === "pending") {
    return <NotificationsSkeleton />;
  }

  if (status === "success" && !notifications.length && !hasNextPage) {
    return <p className="text-center w-full">Vos activités s&apos;afficheront ici.</p>;
  }
  if (status === "error") {
    return (
      <p className="text-center text-destructive w-full">
        Erreur lors de la récupération des données
      </p>
    );
  }

  return (
    <InfiniteScrollContainer
      className="space-y-5"
      onBottomReached={() => hasNextPage && !isFetching && fetchNextPage()}
    >
      {notifications.map((notification) => (
        <Notification key={notification.id} notification={notification} />
      ))}
      {isFetchingNextPage && <Loader2 className="mx-auto my-3 animate-spin" />}
    </InfiniteScrollContainer>
  );
}
