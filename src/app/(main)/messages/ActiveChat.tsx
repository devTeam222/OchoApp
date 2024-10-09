"use client"

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import kyInstance from "@/lib/ky";
import { ChannelData, MessagesSection } from "@/lib/types";
import Message from "./Message";
import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";
import { ArrowLeft, Loader2, X } from "lucide-react";
import { useSession } from "../SessionProvider";
import MessageForm from "./MessageForm";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";
import { toast } from "@/components/ui/use-toast";
import ChatHeader from "./ChatHeader";
import { useMenuBar } from "@/context/MenuBarContext";
import { useEffect } from "react";

interface ActiveChatProps {
  channelId: string | null;
  initialData: ChannelData;
  onClose: () => void;
}

export default function ActiveChat({
  channelId,
  initialData,
  onClose,
}: ActiveChatProps) {
  
  const isProduction = process.env.NODE_ENV === "production";

  const { isVisible, setIsVisible } = useMenuBar();

  useEffect(() => {
    setIsVisible(false)

    // Show the menu bar when ActiveChat unmounts
    return () => {
      setIsVisible(true)
    };
  }, [isVisible, setIsVisible]);

  // Fetching ChannelData using useQuery with initialData for caching
  const { data: channel, isError: isChannelError } = useQuery({
    queryKey: ["chat", channelId],
    queryFn: () => kyInstance.get(`/api/messages/${channelId}/chat-data`).json<ChannelData>(),
    initialData,  // Using initialData as the first cache data
    staleTime: 1000 * 60 * 5, // Cache data for 5 minutes
  });

  if (isChannelError) {
    toast({
      variant: "destructive",
      description: `Impossible de charger les données du canal ${channelId}`,
    });
    onClose();
  }
  
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useInfiniteQuery({
      queryKey: ["messages", channelId],
      queryFn: ({ pageParam }) =>
        kyInstance
          .get(
            `/api/messages/${channelId}/msgs`,
            pageParam ? { searchParams: { cursor: pageParam } } : {},
          )
          .json<MessagesSection>(),
      initialPageParam: null as string | null,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      refetchInterval: isProduction ? 5000 : 10000,
    });
  const { user: loggedUser } = useSession();

  if (!loggedUser) {
    return <p>Veuillez vous connecter pour accéder à vos discussions.</p>;
  }

  const messages = data?.pages.flatMap((page) => page?.messages) || [];

  if (status === "error") {
    toast({
      variant: "destructive",
      description: "Impossible de charger la conversation " + channelId,
    });
    onClose();
  }

  return (
    <div className="absolute flex h-full w-full flex-1 flex-col max-sm:bg-card/30">
      <div className="flex w-full items-center gap-2 px-4 py-3 max-sm:bg-primary/10">
        <div
          className="flex cursor-pointer hover:text-red-500"
          onClick={onClose}
          title="Fermer la discussion"
        >
          <ArrowLeft size={35} className="sm:hidden" />
        </div>
        <ChatHeader channel={channel} />
        <div
          className="flex cursor-pointer hover:text-red-500"
          onClick={onClose}
          title="Fermer la discussion"
        >
          <X size={25} className="max-sm:hidden" />
        </div>
      </div>
      {status === "pending" && <MessagesLoadingSkeleton />}
      {status === "success" && (
        <InfiniteScrollContainer
          className="relative flex h-full flex-col-reverse gap-2 space-y-4 overflow-y-auto p-2 shadow-inner sm:bg-background/50"
          onBottomReached={() =>
            hasNextPage && !isFetchingNextPage && fetchNextPage()
          }
        >
          {status === "success" && !messages.length && (
            <p className="my-auto w-full flex-1 items-center px-2 text-center italic text-muted-foreground">
              Aucun message à afficher. Démarrez une nouvelle discussion.
            </p>
          )}
          {status === "success" &&
            messages.map((message) => {
              if (
                !channel.isGroup &&
                message.type === "CREATE" &&
                messages.length > 1
              ) {
                return null;
              }
              return (
                <Message key={message.id} message={message} channel={channel} />
              );
            })}
          {isFetchingNextPage && (
            <Loader2 className="mx-auto my-3 animate-spin" />
          )}
        </InfiniteScrollContainer>
      )}
      <div className="max-sm:bg-primary/10">
        {!!channelId && <MessageForm channelId={channelId} />}
      </div>
    </div>
  );
}
