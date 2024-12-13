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
import { useEffect, useState } from "react";
import { useActiveChannel } from "@/context/ChatContext";
import { usePathname, useRouter } from "next/navigation";

interface ChatProps {
  channelId: string | null;
  initialData: ChannelData;
  onClose: () => void;
}

export default function Chat({
  channelId,
  initialData,
  onClose,
}: ChatProps) {
  const { setActiveChannelId } = useActiveChannel();
  const isProduction = process.env.NODE_ENV === "production";
  const { isVisible, setIsVisible } = useMenuBar();
  const pathname = usePathname();
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  
  useEffect(() => {
    setIsVisible(false);
    router.push("/messages/chat");
    // Show the menu bar when ActiveChat unmounts
    return () => {
      setIsVisible(true);
    };
  }, [isVisible, setIsVisible, router, pathname]);

  // Fetching ChannelData using useQuery with initialData for caching
  const { data: channel, isError: isChannelError } = useQuery({
    queryKey: ["chat", channelId],
    queryFn: () =>
      kyInstance
        .get(`/api/messages/${channelId}/chat-data`)
        .json<ChannelData>(),
    initialData, // Using initialData as the first cache data
    staleTime: 600_000, // Cache data for 10 minutes
    throwOnError: false,
    refetchInterval: 500_000,
    refetchOnWindowFocus: false,
  });

  if (isChannelError) {
    toast({
      variant: "destructive",
      description: `Impossible de charger la conversation ${channel.name || channelId}`,
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
      throwOnError: false,
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

  useQuery({
    queryKey: ["mark-as-read", channelId],
    queryFn: () =>
      kyInstance.post(`/api/messages/${channelId}/mark-all-as-read/`, {
        throwHttpErrors: false,
      }),
    staleTime: Infinity,
    throwOnError: false,
  });

  const loggedMember = channel.members.find(
    (member) => member.userId === loggedUser.id,
  );
  const isSaved = channel.id === `saved-${loggedMember?.userId}`;
  const isMember = !(
    loggedMember?.type === "OLD" || loggedMember?.type === "BANNED"
  );
  let message = "Vous ne pouvez pas envoyer de message";

  const messages = data?.pages.flatMap((page) => page?.messages) || [];

  const otherUser = !channel.isGroup
    ? channel.members.find((user) => user?.userId !== loggedMember?.userId)
        ?.user || null
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

      <InfiniteScrollContainer
        className="relative flex flex-1 flex-col-reverse space-y-4 overflow-y-auto overflow-x-hidden px-2 py-4 shadow-inner scrollbar-track-primary scrollbar-track-rounded-full sm:bg-background/50"
        onBottomReached={() =>
          hasNextPage && !isFetchingNextPage && fetchNextPage()
        }
      >
        {status === "pending" && <MessagesLoadingSkeleton />}
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
        {!isSaved
          ? !channel.isGroup &&
            !otherUser?.id && (
              <div className="select-none px-5 py-1.5 text-center text-sm">
                <p>{message}</p>
                <p>L&apos;utilisateur n&apos;est plus disponible</p>
              </div>
            )
          : !!channelId && <MessageForm channelId={channelId} />}
        {!isMember ? (
          <div className="select-none px-5 py-1.5 text-center text-sm">
            <p>{message}</p>
            <p>Vous n&apos;êtes plus membre de cette discussion</p>
          </div>
        ) : (
          !!channelId &&
          ((!channel.isGroup && otherUser?.id) || channel.isGroup) && (
            <MessageForm channelId={channelId} />
          )
        )}
      </div>
    </div>
  );
}
