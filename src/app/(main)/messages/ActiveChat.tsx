"use client";

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
import { useActiveChannel } from "@/context/ActiveChatContext";

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
  const { setActiveChannelId } = useActiveChannel();
  const isProduction = process.env.NODE_ENV === "production";
  const { isVisible, setIsVisible } = useMenuBar();

  useEffect(() => {
    setIsVisible(false);

    // Show the menu bar when ActiveChat unmounts
    return () => {
      setIsVisible(true);
    };
  }, [isVisible, setIsVisible]);

  // Fetching ChannelData using useQuery with initialData for caching
  const { data: channel, isError: isChannelError } = useQuery({
    queryKey: ["chat", channelId],
    queryFn: () =>
      kyInstance
        .get(`/api/messages/${channelId}/chat-data`)
        .json<ChannelData>(),
    initialData, // Using initialData as the first cache data
    staleTime: 1000 * 60 * 10, // Cache data for 10 minutes
  });

  if (isChannelError) {
    toast({
      variant: "destructive",
      description: `Impossible de charger les données la conversation ${channelId}`,
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
      staleTime: Infinity,
    });
  const { user: loggedUser } = useSession();

  if (!loggedUser) {
    toast({
      variant: "destructive",
      description: "Impossible de charger la conversation " + channelId,
    });
    setActiveChannelId(null);
    onClose();
  }

  const loggedMember = channel.members.find(
    (member) => member.userId === loggedUser.id,
  );
  const isMember = !(
    loggedMember?.type === "OLD" || loggedMember?.type === "BANNED"
  );
  let message = "Vous ne pouvez pas envoyer de message";

  const messages = data?.pages.flatMap((page) => page?.messages) || [];

  const otherUser = !channel.isGroup
    ? (channel.members.find((user) => user?.userId !== loggedMember?.userId)?.user || null)
    : null;

  return (
    <div className="absolute flex h-full w-full flex-1 flex-col max-sm:bg-card/30">
      <div className="flex w-full items-center gap-2 px-4 py-3 max-sm:bg-card/50">
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

      <InfiniteScrollContainer
        className="relative flex flex-1 flex-col-reverse space-y-4 overflow-y-auto px-2 pb-2 shadow-inner scrollbar-track-primary scrollbar-track-rounded-full sm:bg-background/50"
        onBottomReached={() =>
          hasNextPage && !isFetchingNextPage && fetchNextPage()
        }
      >
        {status === "success" && !messages.length && (
          <p className="my-auto flex w-full flex-1 select-none items-center justify-center px-2 text-center italic text-muted-foreground">
            Aucun message à afficher. Envoyez un nouveau message.
          </p>
        )}
        {status === "success" &&
          messages.map((message, index) => {
            if (
              !channel.isGroup &&
              message.type === "CREATE" &&
              messages.length > 1
            ) {
              return null;
            }
            const showTime =
              index === messages.length - 1 ||
              (index % 20 === 0 && index !== 0);

            return (
              <Message
                key={index}
                message={message}
                channel={channel}
                showTime={showTime}
              />
            );
          })}
        {isFetchingNextPage && (
          <div className="flex w-full justify-center">
            <Loader2 className="mx-auto my-3 animate-spin" />
          </div>
        )}
      </InfiniteScrollContainer>

      <div className="max-sm:bg-card/50">
        {!channel.isGroup && !otherUser?.id &&
           (
            <div className="select-none px-5 py-1.5 text-center text-sm">
              <p>{message}</p>
              <p>L&apos;utilisateur n&apos; plus disponible</p>
            </div>
          )}
        {!isMember && channel.isGroup ? (
          <div className="select-none px-5 py-1.5 text-center text-sm">
            <p>{message}</p>
            <p>Vous n&apos;êtes plus membre de cette discussion</p>
          </div>
        ) : (
          !!channelId && <MessageForm channelId={channelId} />
        )}
      </div>
    </div>
  );
}
