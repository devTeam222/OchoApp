
import { ChannelData, ChannelsSection } from "@/lib/types";
import Channel from "./Channel";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import kyInstance from "@/lib/ky";
import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";
import StartChatDialog from "@/components/messages/StartChatDialog";
import { useSession } from "../SessionProvider";
import ChannelsLoadingSkeleton from "./ChannelsLoadingSkeleton";
import { useEffect } from "react";
import { toast } from "@/components/ui/use-toast";

interface SidebarProps {
  activeChannel: (channel: ChannelData) => void;
  selectedChannelId: string | null;
  onChannelSelect: (channelId: string) => void;
  onCloseChat: () => void;
}

export default function SideBar({
  activeChannel,
  selectedChannelId,
  onChannelSelect,
  onCloseChat,
}: SidebarProps) {
  const { user: loggedinUser } = useSession();

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
      refetchInterval: !selectedChannelId ? 2000 : 45* 1000,
    });
  const channels = data?.pages.flatMap((page) => page.channels) || [];

  const handleChatStart = async (newChannel: ChannelData) => {
    // Vérifier si le canal existe déjà dans le cache
    const existingChannel = channels.find(
      (channel) => channel.id === newChannel.id,
    );

    if (existingChannel) {
      // Si le canal existe, le sélectionner
      onChannelSelect(existingChannel.id);
      activeChannel(existingChannel);
      return;
    }

    handleChannelSelect(newChannel);
  };

  const saveActiveChannelId = (channelId: string | null) => {
    if (channelId) {
      localStorage.setItem("activeChannelId", channelId);
    }
  };

  useEffect(() => {
    const savedChannelId = localStorage.getItem("activeChannelId");
    if (savedChannelId && channels.length > 0) {
      const activeChannel = channels.find(
        (channel) => channel.id === savedChannelId,
      );
      if (activeChannel) {
        handleChannelSelect(activeChannel);
      } else {
        toast({
          variant: "destructive",
          description:
            "Impossible de charger la conversation " + savedChannelId,
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channels]);

  function handleChannelSelect(channel: ChannelData) {
    onChannelSelect(channel.id);
    activeChannel(channel);
    saveActiveChannelId(channel.id);
  }
  if (status === "success" && !channels.length) {
    onCloseChat();
  }

  return (
    <div className="relative flex h-full flex-col">
      <div className="flex items-center justify-between p-4 text-lg font-bold max-sm:bg-primary/10">
        <span>Discussions</span>
        <StartChatDialog
          onChatStart={handleChatStart}
          className="hover:text-primary"
        />
      </div>
      <InfiniteScrollContainer
        className="relative flex flex-1 flex-col space-y-5 overflow-y-auto bg-card/30  sm:bg-background/50 max-w-full"
        onBottomReached={() =>
          hasNextPage && !isFetchingNextPage && fetchNextPage()
        }
      >
        {status === "success" && !channels.length && (
          <p className="mx-auto flex w-full flex-1 select-none items-center px-3 text-center italic text-muted-foreground">
            Aucune discussion disponible
          </p>
        )}
        {status === "pending" && <ChannelsLoadingSkeleton />}
        {status === "error" && (
          <p className="mx-auto flex w-full flex-1 items-center px-3 py-8 text-center italic text-muted-foreground">
            Quelque chose s&apos;est mal passé. Essayez de raffraichir la page
          </p>
        )}
        {status === "success" && (
          <ul className="divide-y-2">
            {channels.map((channel) => (
              <Channel
                key={channel.id}
                channel={channel}
                active={selectedChannelId === channel.id}
                onSelect={() => {
                  onChannelSelect(channel.id);
                  activeChannel(channel);
                }}
              />
            ))}
          </ul>
        )}
      </InfiniteScrollContainer>
        <StartChatDialog
          onChatStart={handleChatStart}
          className="fixed bottom-16 right-7 aspect-square h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary-foreground hover:text-primary max-sm:flex sm:hidden"
        />
    </div>
  );
}
