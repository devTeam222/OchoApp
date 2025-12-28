import { RoomData, RoomsSection } from "@/lib/types";
import Room from "./Room";
import { useInfiniteQuery } from "@tanstack/react-query";
import kyInstance from "@/lib/ky";
import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";
import { useSession } from "../SessionProvider";
import RoomsLoadingSkeleton from "./RoomLoadingSkeleton";
import { useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import { useActiveRoom } from "@/context/ChatContext";
import { Frown, Loader2, MessageSquare, SquarePen } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { t } from "@/context/LanguageContext";
import { useProgress } from "@/context/ProgressContext";

interface SidebarProps {
  activeRoom: (room: RoomData) => void;
  selectedRoomId: string | null;
  onRoomSelect: (roomId: string) => void;
  onNewChat: () => void;
  onCloseChat: () => void;
}

export default function ChatList({
  activeRoom,
  selectedRoomId,
  onRoomSelect,
  onNewChat,
  onCloseChat,
}: SidebarProps) {
  const { user: loggedinUser } = useSession();
  const { activeRoomId, setActiveRoomId } = useActiveRoom();
  const pathname = usePathname();
  const {startNavigation: navigate} = useProgress();

  const { chats, newChat, startNewChat, noChat, unableToLoadChat, dataError } = t();

  const userId = loggedinUser.id;

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useInfiniteQuery({
      queryKey: ["chat-list", userId],
      queryFn: ({ pageParam }) =>
        kyInstance
          .get(
            "/api/chat-list",
            pageParam ? { searchParams: { cursor: pageParam } } : {},
          )
          .json<RoomsSection>(),
      initialPageParam: null as string | null,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      refetchInterval: !selectedRoomId ? 2000 : 45 * 1000,
      staleTime: Infinity,
    });
  const rooms = data?.pages.flatMap((page) => page.rooms) || [];

  const handleChatStart = (newRoom: RoomData) => {
    handleRoomSelect(newRoom);
  };

  useEffect(() => {
    if (status === "success") {
      const savedRoomId = activeRoomId; // Récupérez l'ID du canal actif du contexte

      if (savedRoomId && rooms.length > 0) {
        const activeRoom = rooms.find(
          (room) => room.id === savedRoomId,
        );
        if (activeRoom) {
          handleRoomSelect(activeRoom);
        } 
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rooms, status, activeRoomId]);

  function handleRoomSelect(room: RoomData) {
    onCloseChat();
    onRoomSelect(room.id);
    activeRoom(room);
    setActiveRoomId(room.id);
  }

  if (status === "success" && !rooms.length) {
    onCloseChat();
  }

  if (
    status === "success" &&
    !activeRoomId &&
    pathname === "/messages/chat"
  ) {
    history.pushState(null, "", "/messages")
    navigate("/messages");
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
        onBottomReached={() =>{
          hasNextPage && !isFetchingNextPage && fetchNextPage();
          console.log("recahed");
        }
        }
      >
        {status === "success" && !rooms.length && (
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
        {status === "pending" && <RoomsLoadingSkeleton />}
        {status === "error" && (
          <p className="flex w-full flex-1 select-none items-center px-3 py-8 text-center italic text-muted-foreground">
            <div className="my-8 flex w-full select-none flex-col items-center gap-2 text-center text-muted-foreground">
              <Frown size={150} />
              <h2 className="text-xl">{dataError}</h2>
            </div>
          </p>
        )}
        {status === "success" && (
          <ul className="">
            {rooms.map((room) => (
              <Room
                key={room.id}
                room={room}
                active={selectedRoomId === room.id}
                onSelect={() => {
                  handleRoomSelect(room);
                }}
              />
            ))}
          </ul>
        )}
      </InfiniteScrollContainer>
      {isFetchingNextPage && (
          <div className="flex w-full justify-center">
            <Loader2 className="mx-auto my-3 animate-spin" />
          </div>
        )}
      <div
        className="fixed bottom-20 right-5 aspect-square h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary-foreground hover:text-primary flex sm:absolute sm:bottom-5"
        onClick={onNewChat}
        title={startNewChat}
      >
        <SquarePen />
      </div>
    </div>
  );
}
