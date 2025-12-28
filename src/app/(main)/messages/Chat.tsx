"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import kyInstance from "@/lib/ky";
import { RoomData, MessagesSection } from "@/lib/types";
import Message, { TypingIndicator } from "./Message";
import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";
import { ArrowLeft, Frown, Loader2, Search, X } from "lucide-react";
import { useSession } from "../SessionProvider";
import MessageForm from "./MessageForm";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";
import { toast } from "@/components/ui/use-toast";
import ChatHeader from "./ChatHeader";
import { useMenuBar } from "@/context/MenuBarContext";
import { useEffect, useState } from "react";
import { useActiveRoom } from "@/context/ChatContext";
import { usePathname, useRouter } from "next/navigation";
import { t } from "@/context/LanguageContext";
import ChatLoadingSkeleton from "./ChatLoadingSkeleton";
import { useProgress } from "@/context/ProgressContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface ChatProps {
  roomId: string | null;
  initialData: RoomData | undefined;
  onClose: () => void;
}

export default function Chat({ roomId, initialData, onClose }: ChatProps) {
  const { setActiveRoomId } = useActiveRoom();
  const isProduction = process.env.NODE_ENV === "production";
  const { isVisible, setIsVisible } = useMenuBar();
  const pathname = usePathname();
  const router = useRouter();
  const { startNavigation: navigate } = useProgress();
  const [prevPathname, setPrevPathname] = useState(pathname);
  const [messageInputExpanded, setMessageInputExpanded] = useState(true);

  const { unableToLoadChat, noMessage, dataError, search } = t();

  useEffect(() => {
    setIsVisible(!roomId);
    if (roomId && window.location.pathname !== "/messages/chat") {
      history.pushState(null, "", "/messages/chat");
      navigate("/messages/chat");
    }
    // Show the menu bar when ActiveChat unmounts
    return () => {
      setIsVisible(true);
    };
  }, [isVisible, setIsVisible, router, pathname, roomId, navigate]);

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

  // Fetching RoomData using useQuery with initialData for caching
  const {
    data: room,
    isError: isRoomError,
    isLoading,
  } = useQuery({
    queryKey: ["chat", roomId],
    queryFn: () =>
      kyInstance
        .get(`/api/messages/${roomId}/chat-data`)
        .json<RoomData>(),
    initialData, // Using initialData as the first cache data
    staleTime: 600_000, // Cache data for 10 minutes
    throwOnError: false,
    refetchOnWindowFocus: false,
    enabled: !!roomId,
  });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useInfiniteQuery({
      queryKey: ["messages", roomId],
      queryFn: ({ pageParam }) =>
        kyInstance
          .get(
            `/api/messages/${roomId}/msgs`,
            pageParam ? { searchParams: { cursor: pageParam } } : {},
          )
          .json<MessagesSection>(),
      initialPageParam: null as string | null,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      refetchInterval: 2000,
      staleTime: Infinity,
      throwOnError: false,
      enabled: !!roomId,
    });
  const { user: loggedUser } = useSession();

  useQuery({
    queryKey: ["mark-as-read", roomId],
    queryFn: () =>
      kyInstance.post(`/api/messages/${roomId}/mark-all-as-read/`, {
        throwHttpErrors: false,
      }),
    staleTime: Infinity,
    throwOnError: false,
  });

  if (!roomId) {
    return null;
  }

  if (isLoading) {
    return <ChatLoadingSkeleton onChatClose={onClose} />;
  }
  const roomName = room?.name || roomId || "Chat";
  if (!room) {
    toast({
      variant: "destructive",
      description: unableToLoadChat.replace("[name]", roomName),
    });
    onClose();
    return null;
  }

  if (isRoomError) {
    toast({
      variant: "destructive",
      description: unableToLoadChat.replace("[name]", roomName),
    });
    onClose();
    return null;
  }

  if (!loggedUser) {
    toast({
      variant: "destructive",
      description: unableToLoadChat.replace("[name]", roomName),
    });
    setActiveRoomId(null);
    onClose();
    return null;
  }

  const loggedMember = room.members.find(
    (member) => member.userId === loggedUser.id,
  );
  const isSaved = room.id === `saved-${loggedMember?.userId}`;
  const isMember = !(
    loggedMember?.type === "OLD" || loggedMember?.type === "BANNED"
  );
  let message = "Envoi de messages non autorisés";

  const messages = data?.pages.flatMap((page) => page?.messages) || [];

  const otherUser = !room.isGroup
    ? room.members.find((user) => user?.userId !== loggedMember?.userId)
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
        <ChatHeader room={room} onDelete={onClose} />
        <div
          className="flex cursor-pointer hover:text-red-500"
          onClick={onClose}
          title="Fermer la discussion"
        >
          <X size={25} className="max-sm:hidden" />
        </div>
      </div>

      <div className="relative flex flex-1 flex-col-reverse overflow-y-auto overflow-x-hidden shadow-inner scrollbar-track-primary scrollbar-track-rounded-full has-[.reaction-open]:z-50 sm:bg-background/50 pb-[74px]">
        <InfiniteScrollContainer
          className="flex w-full flex-col-reverse gap-4 p-4 px-2"
          onBottomReached={() => {
            hasNextPage && !isFetchingNextPage && fetchNextPage();
          }}
          reversed
        >
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
                  room={room}
                  showTime={showTime}
                />
              );
            })}
            {/* <TypingIndicator typingUsers={[{id: otherUser?.id || "", displayName: otherUser?.displayName || "", avatarUrl: otherUser?.avatarUrl || ""}]} /> */}
        </InfiniteScrollContainer>
        {isFetchingNextPage && (
          <div className="flex w-full justify-center">
            <Loader2 className="mx-auto my-3 animate-spin" />
          </div>
        )}
      </div>

      <div className="bg-gradient-to-t from-card/80 to-transparent absolute w-full bottom-0">
        <div className={cn("flex p-2", !messageInputExpanded && "gap-2")}>
          <div className={cn("flex gap-0 items-end transition-all duration-75 w-fit", !messageInputExpanded && "w-full gap-3")}>
            <Button  variant="outline" onClick={()=>setMessageInputExpanded(!messageInputExpanded)} title={search} className="aspect-square size-12 cursor-pointer outline-input p-2">
              <Search className="size-5"/>
            </Button>
            {(
              <div className={cn("relative flex w-full items-end gap-1 rounded-3xl border border-input bg-background p-1 ring-primary ring-offset-background transition-[width] duration-75 has-[input:focus-visible]:outline-none has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-ring has-[input:focus-visible]:ring-offset-2", messageInputExpanded ? "w-0 invisible overflow-hidden" : "w-full")}>
                        <Input
                          placeholder={search + "..."}
                          className={cn("outline-none max-h-[10rem] min-h-10 w-full overflow-y-auto rounded-none border-none bg-transparent px-4 py-2 pr-0.5 ring-offset-transparent focus-visible:ring-transparent transition-all duration-75")}
                        />
                      </div>
            )}

          </div>
          {!isSaved
            ? !room.isGroup &&
            !otherUser?.id && (
              <div className="select-none px-5 py-1.5 text-center font-semibold relative flex w-full gap-1 rounded-3xl border border-input bg-background p-1 ring-primary ring-offset-background transition-[width] duration-75 justify-center items-center">
                <p>{message}</p>
              </div>
            )
            : !!roomId && <MessageForm expanded={messageInputExpanded} onExpanded={()=>setMessageInputExpanded(true)} roomId={roomId} />}
          {!isMember ? (
            <div className="select-none px-5 py-1.5 text-center font-semibold relative flex w-full gap-1 rounded-3xl border border-input bg-background p-1 ring-primary ring-offset-background transition-[width] duration-75 justify-center items-center">
              <p>{message}</p>
            </div>
          ) : (
            !!roomId &&
            ((!room.isGroup && otherUser?.id) || room.isGroup) && (
              <MessageForm expanded={messageInputExpanded} onExpanded={()=>setMessageInputExpanded(true)} roomId={roomId} />
            )
          )}
        </div>
      </div>
    </div>
  );
}
