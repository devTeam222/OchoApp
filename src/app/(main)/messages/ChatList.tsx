import { ChannelData, ChannelsSection } from "@/lib/types";
import Channel from "./Channel";
import { useInfiniteQuery } from "@tanstack/react-query";
import kyInstance from "@/lib/ky";
import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";
import { useSession } from "../SessionProvider";
import ChannelsLoadingSkeleton from "./ChannelsLoadingSkeleton";
import { useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import { useActiveChannel } from "@/context/ChatContext";
import { Frown, MessageSquare, SquarePen } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { t } from "@/context/LanguageContext";

interface SidebarProps {
  activeChannel: (channel: ChannelData) => void;
  selectedChannelId: string | null;
  onChannelSelect: (channelId: string) => void;
  onNewChat: () => void;
  onCloseChat: () => void;
}

export default function ChatList({
  activeChannel,
  selectedChannelId,
  onChannelSelect,
  onNewChat,
  onCloseChat,
}: SidebarProps) {
  const { user: loggedinUser } = useSession();
  const { activeChannelId, setActiveChannelId } = useActiveChannel();
  const pathname = usePathname();
  const router = useRouter();

  const { chats, newChat, startNewChat, noChat, unableToLoadChat, dataError } = t();

  const userId = loggedinUser.id;

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useInfiniteQuery({
      queryKey: ["chat-channels", userId],
      queryFn: ({ pageParam }) =>
        kyInstance
          .get(
            "/api/chat-channels",
            pageParam ? { searchParams: { cursor: pageParam } } : {},
          )
          .json<ChannelsSection>(),
      initialPageParam: null as string | null,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      refetchInterval: !selectedChannelId ? 2000 : 45 * 1000,
      staleTime: Infinity,
    });
  const channels = data?.pages.flatMap((page) => page.channels) || [];

  const handleChatStart = (newChannel: ChannelData) => {
    handleChannelSelect(newChannel);
  };

  useEffect(() => {
    if (status === "success") {
      const savedChannelId = activeChannelId; // Récupérez l'ID du canal actif du contexte

      if (savedChannelId && channels.length > 0) {
        const activeChannel = channels.find(
          (channel) => channel.id === savedChannelId,
        );
        if (activeChannel) {
          handleChannelSelect(activeChannel);
        } else {
          toast({
            variant: "destructive",
            description: unableToLoadChat.replace("[name]", savedChannelId),
          });
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channels, status, activeChannelId]);

  function handleChannelSelect(channel: ChannelData) {
    onCloseChat();
    onChannelSelect(channel.id);
    activeChannel(channel);
    setActiveChannelId(channel.id);
  }

  if (status === "success" && !channels.length) {
    onCloseChat();
  }

  if (
    status === "success" &&
    channels.length &&
    !selectedChannelId &&
    pathname === "/messages/chat"
  ) {
    router.push("/messages");
  }

  return (
    <div className="relative flex h-full flex-col">
      <div className="flex items-center justify-between p-4 text-lg font-bold shadow-sm max-sm:bg-card/50">
        <span>{chats}</span>
        <span
          className="cursor-pointer hover:text-primary max-sm:hidden"
          title={startNewChat}
          onClick={onNewChat}
        >
          <SquarePen />
        </span>
      </div>
      <InfiniteScrollContainer
        className="relative flex max-w-full flex-1 flex-col space-y-5 overflow-y-auto bg-card/30 sm:bg-background/50"
        onBottomReached={() =>
          hasNextPage && !isFetchingNextPage && fetchNextPage()
        }
      >
        {status === "success" && !channels.length && (
          <p className="flex w-full flex-1 select-none items-center px-3 py-8 text-center italic text-muted-foreground">
            <div className="my-8 flex w-full flex-col items-center gap-2 text-center text-muted-foreground">
              <MessageSquare size={150} />
              <h2 className="text-xl">
                {noChat.split("[pen]")[0]}
                <SquarePen className="inline" />
                {noChat.split("[pen]")[1]}
              </h2>
            </div>
          </p>
        )}
        {status === "pending" && <ChannelsLoadingSkeleton />}
        {status === "error" && (
          <p className="flex w-full flex-1 select-none items-center px-3 py-8 text-center italic text-muted-foreground">
            <div className="my-8 flex w-full select-none flex-col items-center gap-2 text-center text-muted-foreground">
              <Frown size={150} />
              <h2 className="text-xl">{dataError}</h2>
            </div>
          </p>
        )}
        {status === "success" && (
          <ul className="divide-y sm:divide-y-2">
            {channels.map((channel) => (
              <Channel
                key={channel.id}
                channel={channel}
                active={selectedChannelId === channel.id}
                onSelect={() => {
                  handleChannelSelect(channel);
                }}
              />
            ))}
          </ul>
        )}
      </InfiniteScrollContainer>
      <div
        className="fixed bottom-20 right-5 aspect-square h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary-foreground hover:text-primary max-sm:flex sm:hidden"
        onClick={onNewChat}
        title={startNewChat}
      >
        <SquarePen />
      </div>
    </div>
  );
}
