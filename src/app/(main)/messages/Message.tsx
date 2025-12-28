// "use client"

import UserAvatar from "@/components/UserAvatar";
import { RoomData, MessageData, ReadInfo } from "@/lib/types";
import { useSession } from "../SessionProvider";
import Linkify from "@/components/Linkify";
import { MessageType } from "@prisma/client";
import { QueryKey, useQuery, useQueryClient } from "@tanstack/react-query";
import Time from "@/components/Time";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import UserTooltip from "@/components/UserTooltip";
import kyInstance from "@/lib/ky";
import MessageMoreButton from "@/components/messages/MessageMoreButton";
import Reaction from "@/components/Reaction";
import { t } from "@/context/LanguageContext";

type MessageProps = {
  message: MessageData;
  room: RoomData;
  showTime?: boolean;
};

export default function Message({
  message,
  room,
  showTime = false,
}: MessageProps) {
  const { user: loggedUser } = useSession();
  const queryClient = useQueryClient();
  const messageId = message.id;
  const roomId = room.id;
  const [isChecked, setIsChecked] = useState(showTime);
  const [isMessageMoreOpen, setIsMessageMoreOpen] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isQuickReactionOpen, setIsQuickReactionOpen] = useState(false);
  const [reactionPosition, setReactionPosition] = useState<"top" | "bottom">(
    "bottom",
  );
  const messageRef = useRef<HTMLDivElement>(null);
  const {
    appUser,
    newMember,
    youAddedMember,
    addedYou,
    addedMember,
    memberLeft,
    youRemovedMember,
    removedYou,
    removedMember,
    memberBanned,
    youBannedMember,
    bannedYou,
    bannedMember,
    youCreatedGroup,
    createdGroup,
    canChatWithYou,
    youReactedToYourMessage,
    youReactedToMessage,
    reactedToMessage,
    reactedMemberMessage,
    messageYourself,
    sent,
    seenBy,
    seenByAnd,
    noPreview,
    unavailableMessage,
    deletedChat,
  } = t();

  const seen = seenByAnd.match(/-(.*?)-/)?.[1] || "Seen";

  useEffect(() => {
    if (!messageRef.current) return;

    const messageElement = messageRef.current;
    const parentElement = messageElement.parentElement;
    const handleScroll = () => {
      if (!parentElement) return;

      const messageRect = messageElement.getBoundingClientRect();
      const parentRect = parentElement.getBoundingClientRect();

      // Détecte si le message est proche du haut ou du bas du conteneur
      const isNearTop = messageRect.bottom - parentRect.top < 320; // marge de 200px
      const isNearBottom = parentRect.bottom - messageRect.top < 320; // marge de 320px

      if (isNearTop) {
        setReactionPosition("top");
        return;
      }
      if (isNearBottom) {
        setReactionPosition("bottom");
        return;
      }
      setReactionPosition("bottom"); // Position par défaut
    };

    handleScroll(); // Initial call
    parentElement?.addEventListener("scroll", handleScroll);

    return () => {
      parentElement?.removeEventListener("scroll", handleScroll);
    };
  }, [message.content]);

  const queryKey: QueryKey = ["reads-info", message.id];

  const { data } = useQuery({
    queryKey,
    queryFn: () =>
      kyInstance
        .get(`/api/message/${messageId}/read`, { throwHttpErrors: false })
        .json<ReadInfo>(),
    staleTime: Infinity,
    refetchInterval: 5000,
    throwOnError: false,
  });

  const reads = data?.reads ?? [];

  // Marquer comme lu si non déjà fait
  const { status } = useQuery({
    queryKey: ["read-status", messageId, loggedUser.id],
    queryFn: async () => {
      const isRead = !!reads.find((read) => read.id === loggedUser.id);
      if (!isRead) {
        // Ajouter l'utilisateur dans le cache existant
        queryClient.setQueryData<ReadInfo>(queryKey, (oldData) => ({
          reads: [
            ...(oldData?.reads ?? []),
            {
              id: loggedUser.id,
              username: loggedUser.username,
              displayName: loggedUser.displayName,
            },
          ],
        }));

        return kyInstance.post(`/api/message/${messageId}/read`);
      }
      return {};
    },
    refetchOnWindowFocus: false, // Pas de refetch lors du focus de la fenêtre
    staleTime: Infinity,
  });
  queryClient.setQueryData(["unread-chat-messages"], { unreadCount: 0 });
  queryClient.setQueryData(["unread-chat-messages", room.id], {
    unreadCount: 0,
  });

  if (status === "success") {
    queryClient.setQueryData(["unread-chat-messages", room.id], {
      unreadCount: 0,
    });
    queryClient.invalidateQueries({ queryKey: ["unread-messages"] });
  }

  const showDetail = isChecked || showTime;

  function toggleCheck() {
    setIsChecked(!isChecked);
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsMessageMoreOpen(true);
  };

  const toggleContextOpenChange = (open: boolean) => {
    setIsMessageMoreOpen(open);
  };

  if (!loggedUser) {
    return null;
  }

  const views = reads
    .filter((read) => read.id !== loggedUser.id)
    .filter((read) => read.id !== message.senderId)
    .map((read) => read.displayName.split(" ")[0]);
  const hasSeen = reads.find((read) => read.id === loggedUser.id);

  const otherUser =
    room.id === `saved-${loggedUser.id}`
      ? { user: loggedUser, userId: loggedUser.id }
      : room?.members?.filter(
          (member) => member.userId !== loggedUser.id,
        )[0];
  const messageType: MessageType = message.type;

  const sender =
    message.sender?.id === loggedUser.id
      ? "Vous"
      : room.isGroup
        ? message.sender?.displayName.split(" ")[0] || ""
        : otherUser?.user?.displayName.split(" ")[0] || "";
  const recipient = message.recipient;
  let newMemberMsg, oldMemberMsg;

  const senderMember = room.members.find(
    (member) => member.userId === message.sender?.id,
  );

  const otherUserFirstName =
    otherUser?.user?.displayName.split(" ")[0] || appUser;
  const senderFirstName = message.sender?.displayName.split(" ")[0] || appUser;
  const recipientFirstName =
    message.recipient?.displayName.split(" ")[0] || appUser;
  const isSender = message.sender?.id === loggedUser.id;
  const isRecipient = message.recipient?.id === loggedUser.id;

  if (recipient && room.isGroup) {
    const memberName = recipientFirstName;

    // Check if message type is info of added member
    if (messageType === "NEWMEMBER") {
      newMemberMsg = newMember.replace("[name]", memberName);
      if (message.sender) {
        isSender
          ? (newMemberMsg = youAddedMember.replace("[name]", memberName))
          : (newMemberMsg = isRecipient
              ? addedYou.replace("[name]", senderFirstName)
              : addedMember
                  .replace("[name]", senderFirstName)
                  .replace("[member]", memberName));
      }
    }
    if (messageType === "LEAVE") {
      oldMemberMsg = memberLeft.replace("[name]", memberName);
      if (message.sender) {
        isSender
          ? (oldMemberMsg = youRemovedMember.replace("[name]", memberName))
          : (oldMemberMsg = isRecipient
              ? removedYou.replace("[name]", senderFirstName)
              : removedMember
                  .replace("[name]", senderFirstName)
                  .replace("[member]", memberName));
      }
    }
    if (messageType === "BAN") {
      oldMemberMsg = memberBanned.replace("[name]", memberName);
      if (message.sender) {
        isSender
          ? (oldMemberMsg = youBannedMember.replace("[name]", memberName))
          : (oldMemberMsg = isRecipient
              ? bannedYou.replace("[name]", senderFirstName)
              : bannedMember
                  .replace("[name]", senderFirstName)
                  .replace("[member]", memberName));
      }
    }
  }

  const contentsTypes = {
    CREATE: room.isGroup
      ? isSender
        ? youCreatedGroup.replace("[name]", senderFirstName)
        : createdGroup.replace("[name]", senderFirstName)
      : canChatWithYou.replace("[name]", otherUserFirstName || appUser),
    CONTENT: message.content,
    CLEAR: noPreview,
    DELETE: deletedChat,
    SAVED: messageYourself,
    NEWMEMBER: newMemberMsg,
    LEAVE: oldMemberMsg,
    BAN: oldMemberMsg,
    REACTION: isSender
      ? isRecipient
        ? youReactedToYourMessage
            .replace("[name]", senderFirstName)
            .replace("[r]", message.content)
        : youReactedToMessage
            .replace("[name]", senderFirstName)
            .replace("[r]", message.content)
            .replace("[member]", recipientFirstName)
      : isRecipient
        ? reactedToMessage
            .replace("[name]", senderFirstName)
            .replace("[r]", message.content)
        : reactedMemberMessage
            .replace("[name]", senderFirstName)
            .replace("[r]", message.content)
            .replace("[member]", recipientFirstName),
  };

  if (
    (message.recipientId === loggedUser.id && message.type === "BAN") ||
    message.type === "LEAVE"
  ) {
    const queryKey = ["chat", roomId];

    queryClient.invalidateQueries({ queryKey });
  }

  const messageDate = new Date(message.createdAt);
  const currentDate = new Date();
  const timeDifferenceInDays = Math.floor(
    (currentDate.getTime() - messageDate.getTime()) / (24 * 60 * 60 * 1000),
  );

  const messageContent = contentsTypes[messageType];

  const canReact = room.isGroup
    ? room.members.some((member) => member.userId === loggedUser.id) &&
      room.members.find((member) => member.userId === loggedUser.id)
        ?.type !== "BANNED" &&
      room.members.find((member) => member.userId === loggedUser.id)
        ?.type !== "OLD"
    : !!otherUser.user?.id;

  const isOwner = message.senderId === loggedUser.id;
  return messageType !== "CONTENT" ? (
    messageType !== "REACTION" ? (
      <div className="relative flex w-full flex-col gap-2">
        <div
          className={cn(
            "flex w-full select-none justify-center overflow-hidden rounded-sm text-center text-sm transition-all",
            !showTime ? "h-0 opacity-0" : "h-6 opacity-100",
          )}
        >
          <div className="rounded-sm bg-primary/30 p-0.5 px-2">
            <Time time={message.createdAt} full />
          </div>
        </div>
        <div
          className={`top-0 flex select-none justify-center text-center text-sm text-primary ${messageType === "CREATE" ? "flex-1" : ""}`}
        >
          {messageContent}
        </div>
      </div>
    ) : null
  ) : (
    <div
      className={cn(
        "relative flex w-full flex-col gap-2",
        isPickerOpen && "z-10",
      )}
      ref={messageRef}
    >
      <div
        className={cn(
          "flex w-full select-none justify-center overflow-hidden text-center text-sm transition-all",
          !showDetail ? "h-0 opacity-0" : "h-5 opacity-100",
          showTime && "h-6",
        )}
      >
        <div className={cn(showTime && "rounded-sm bg-primary/30 p-0.5 px-2")}>
          <Time
            time={message.createdAt}
            full
            relative={showTime && timeDifferenceInDays < 2}
          />
        </div>
      </div>
      <div
        className={cn(
          "flex w-full gap-2",
          message.senderId === loggedUser.id && "flex-row-reverse",
        )}
      >
        {message.senderId !== loggedUser.id && (
          <span className="py-2">
            {senderMember?.user ? (
              <UserTooltip user={senderMember.user}>
                <UserAvatar
                  avatarUrl={message.sender?.avatarUrl}
                  size={20}
                  className="flex-none"
                />
              </UserTooltip>
            ) : (
              <UserAvatar
                avatarUrl={message.sender?.avatarUrl}
                size={20}
                className="flex-none"
              />
            )}
          </span>
        )}
        <div className={"group/message relative w-fit max-w-[75%] select-none"}>
          {message.senderId !== loggedUser.id && (
            <div className="ps-2 text-sm text-muted-foreground">
              {message.sender?.displayName || "Utilisateur OchoApp"}
            </div>
          )}
          <div
            className={cn(
              "flex w-fit items-center gap-1",
              !isOwner && "flex-row-reverse",
            )}
          >
            <MessageMoreButton
              message={message}
              className={cn(
                "opacity-0 sm:group-hover/message:opacity-100",
                showDetail && "opacity-100",
              )}
              open={isMessageMoreOpen}
              onOpenChange={(open) => {
                toggleContextOpenChange(open);
              }}
              onReactOpen={() => {
                setIsPickerOpen(true);
                setIsQuickReactionOpen(true);
              }}
              canReact={canReact}
            />
            <div className="relative h-fit w-fit">
              <Linkify>
                <p
                  onClick={toggleCheck}
                  onContextMenu={handleContextMenu}
                  className={cn(
                    "w-fit select-none rounded-3xl px-4 py-2 *:font-bold",
                    isOwner
                      ? "bg-primary text-primary-foreground *:text-primary-foreground"
                      : "bg-primary/10",
                    !message.content &&
                      "bg-transparent text-muted-foreground outline outline-2 outline-muted-foreground",
                  )}
                >
                  {message.content ?? (
                    <span className="italic">{unavailableMessage}</span>
                  )}
                </p>
              </Linkify>
              {canReact && (
                <Reaction
                  message={message}
                  className={cn(
                    "absolute rounded-2xl border-2 border-solid border-background bg-card p-1 px-2",
                    isOwner ? "right-0" : "left-0",
                  )}
                  isOwner={isOwner}
                  open={isPickerOpen}
                  onOpenChange={(open) => {
                    setIsPickerOpen(open);
                    setIsQuickReactionOpen(false);
                  }}
                  size={12}
                  position={reactionPosition}
                  quickReaction={isQuickReactionOpen}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      <div
        className={cn(
          "flex w-full select-none overflow-hidden px-4 py-2 pt-3 text-justify text-xs transition-all",
          !showDetail ? "h-0 opacity-0" : "opacity-100",
          message.senderId === loggedUser.id ? "flex-row-reverse" : "ps-10",
        )}
        onClick={toggleCheck}
      >
        <p
          className={cn(
            showDetail ? "animate-appear-b" : "hidden",
            "max-h-40 w-fit max-w-[50%] text-ellipsis text-start",
          )}
        >
          {!!views.length ? (
            room.isGroup ? (
              <span>
                <span className="font-bold">{seen}</span>
                {views.length > 1
                  ? seenByAnd
                      .replace(/-.*?-/, "")
                      .replace(
                        "[names]",
                        views.slice(0, views.length - 1).join(", "),
                      )
                      .replace("[name]", views[views.length - 1])
                  : seenBy
                      .replace(/-.*?-/, "")
                      .replace("[name]", views[views.length - 1])}
              </span>
            ) : (
              <span className="font-bold">{seen}</span>
            )
          ) : (
            <span className="font-bold">
              {(isSender) ? sent : seen}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
