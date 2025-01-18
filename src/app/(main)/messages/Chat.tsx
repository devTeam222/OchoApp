"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import kyInstance from "@/lib/ky";
import { ChannelData, MessagesSection } from "@/lib/types";
import Message from "./Message";
import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";
import { ArrowLeft, Frown, Loader2, X } from "lucide-react";
import { useSession } from "../SessionProvider";
import MessageForm from "./MessageForm";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";
import { toast } from "@/components/ui/use-toast";
import ChatHeader from "./ChatHeader";
import { useMenuBar } from "@/context/MenuBarContext";
import { useEffect, useState } from "react";
import { useActiveChannel } from "@/context/ChatContext";
import { usePathname, useRouter } from "next/navigation";
import { t } from "@/context/LanguageContext";
import ChatLoadingSkeleton from "./ChatLoadingSkeleton";
import { useProgress } from "@/context/ProgressContext";

interface ChatProps {
  channelId: string | null;
  initialData: ChannelData | undefined;
  onClose: () => void;
}

export default function Chat({ channelId, initialData, onClose }: ChatProps) {
  const { setActiveChannelId } = useActiveChannel();
  const isProduction = process.env.NODE_ENV === "production";
  const { isVisible, setIsVisible } = useMenuBar();
  const pathname = usePathname();
  const router = useRouter();
  const { startNavigation: navigate } = useProgress();
  const [prevPathname, setPrevPathname] = useState(pathname);

  const { unableToLoadChat, noMessage, dataError } = t();

  useEffect(() => {
    setIsVisible(!channelId);
    if (channelId && window.location.pathname !== "/messages/chat") {
      history.pushState(null, "", "/messages/chat");
      navigate("/messages/chat");
    }
    // Show the menu bar when ActiveChat unmounts
    return () => {
      setIsVisible(true);
    };
  }, [isVisible, setIsVisible, router, pathname, channelId, navigate]);

  const handlePopState = () => {
    const currentPathname = window.location.pathname;

    if (prevPathname === "/messages/chat" && currentPathname === "/messages") {
      onClose();
    }
    setPrevPathname(currentPathname);
  };

  useEffect(() => {
    // Ajouter un écouteur d'événement popstate
    window.addEventListener("popstate", handlePopState);

    return () => {
      // Nettoyer l'écouteur à la désactivation du composant
      window.removeEventListener("popstate", handlePopState);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prevPathname]);

  useEffect(() => {
    setPrevPathname(pathname);
  }, [pathname]);
  useEffect(() => {
    // Ajouter un écouteur d'événement popstate
    window.addEventListener("popstate", handlePopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetching ChannelData using useQuery with initialData for caching
  const {
    data: channel,
    isError: isChannelError,
    isLoading,
  } = useQuery({
    queryKey: ["chat", channelId],
    queryFn: () =>
      kyInstance
        .get(`/api/messages/${channelId}/chat-data`)
        .json<ChannelData>(),
    initialData, // Using initialData as the first cache data
    staleTime: 600_000, // Cache data for 10 minutes
    throwOnError: false,
    refetchOnWindowFocus: false,
    enabled: !!channelId,
  });

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
      refetchInterval: 2000,
      staleTime: Infinity,
      throwOnError: false,
      enabled: !!channelId,
    });
  const { user: loggedUser } = useSession();

  useQuery({
    queryKey: ["mark-as-read", channelId],
    queryFn: () =>
      kyInstance.post(`/api/messages/${channelId}/mark-all-as-read/`, {
        throwHttpErrors: false,
      }),
    staleTime: Infinity,
    throwOnError: false,
  });

  if (!channelId) {
    return null;
  }

  if (isLoading) {
    return <ChatLoadingSkeleton onChatClose={onClose} />;
  }
  const channelName = channel?.name || channelId || "Chat";
  if (!channel) {
    toast({
      variant: "destructive",
      description: unableToLoadChat.replace("[name]", channelName),
    });
    onClose();
    return null;
  }

  if (isChannelError) {
    toast({
      variant: "destructive",
      description: unableToLoadChat.replace("[name]", channelName),
    });
    onClose();
    return null;
  }

  if (!loggedUser) {
    toast({
      variant: "destructive",
      description: unableToLoadChat.replace("[name]", channelName),
    });
    setActiveChannelId(null);
    onClose();
    return null;
  }

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
        <ChatHeader channel={channel} onDelete={onClose} />
        <div
          className="flex cursor-pointer hover:text-red-500"
          onClick={onClose}
          title="Fermer la discussion"
        >
          <X size={25} className="max-sm:hidden" />
        </div>
      </div>

      <InfiniteScrollContainer
        className="relative flex flex-1 flex-col-reverse overflow-y-auto overflow-x-hidden shadow-inner scrollbar-track-primary scrollbar-track-rounded-full has-[.reaction-open]:z-50 sm:bg-background/50"
        onBottomReached={() =>
          hasNextPage && !isFetchingNextPage && fetchNextPage()
        }
      >
        <div className="flex w-full flex-col-reverse gap-4 p-4 px-2">
          {status === "pending" && <MessagesLoadingSkeleton />}
          {status === "success" && !hasNextPage && !messages.length && (
            <p className="my-auto flex w-full flex-1 select-none items-center justify-center px-2 text-center italic text-muted-foreground">
              {noMessage}
            </p>
          )}
          {status === "error" && (
            <div className="flex w-full flex-1 select-none flex-col items-center px-3 py-8 text-center italic text-muted-foreground">
              <Frown size={100} />
              <h2 className="text-xl">{dataError}</h2>
            </div>
          )}
          {status === "success" &&
            messages.map((message, index) => {
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
        </div>
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
