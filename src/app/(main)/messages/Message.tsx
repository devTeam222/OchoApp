// "use client"

import UserAvatar from "@/components/UserAvatar";
import { ChannelData, MessageData, ReadInfo, ReadUser } from "@/lib/types";
import { useSession } from "../SessionProvider";
import Linkify from "@/components/Linkify";
import { MessageType } from "@prisma/client";
import { QueryKey, useQuery, useQueryClient } from "@tanstack/react-query";
import Time from "@/components/Time";
import { useState } from "react";
import { cn } from "@/lib/utils";
import UserTooltip from "@/components/UserTooltip";
import kyInstance from "@/lib/ky";
import { Button } from "@/components/ui/button";
import MessageMoreButton from "@/components/messages/MessageMoreButton";
import { Plus } from "lucide-react";

type MessageProps = {
  message: MessageData;
  channel: ChannelData;
  showTime?: boolean;
};

export default function Message({
  message,
  channel,
  showTime = false,
}: MessageProps) {
  const { user: loggedUser } = useSession();
  const queryClient = useQueryClient();
  const messageId = message.id;
  const channelId = channel.id;
  const [isChecked, setIsChecked] = useState(showTime);
  const [isMessageMoreOpen, setIsMessageMoreOpen] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isQuickReactionOpen, setIsQuickReactionOpen] = useState(false);

  const queryKey: QueryKey = ["reads-info", message.id];

  const { data } = useQuery({
    queryKey,
    queryFn: () =>
      kyInstance.get(`/api/message/${messageId}/read`).json<ReadInfo>(),
    staleTime: Infinity,
    refetchInterval: 1000,
  });

  const reads = data?.reads ?? [];

  const { status } = useQuery({
    queryKey,
    queryFn: () => {
      const isRead = !!(
        reads && reads.find((read) => read.id === loggedUser.id)
      );
      return !isRead ? kyInstance.post(`/api/message/${messageId}/read`) : {};
    },
    throwOnError: false,
  });
  queryClient.setQueryData(["unread-chat-messages"], { unreadCount: 0 });
  queryClient.setQueryData(["unread-chat-messages", channel.id], {
    unreadCount: 0,
  });

  if (status === "success") {
    queryClient.setQueryData(["unread-chat-messages", channel.id], {
      unreadCount: 0,
    });
    queryClient.invalidateQueries({ queryKey: ["unread-messages"] });
  }

  const showDetail = isChecked || showTime;

  function toggleCheck() {
    setIsChecked(!isChecked);
  }

  function addReaction(emoji: string) {}

  const openPicker = () => {
    setIsQuickReactionOpen(false);
    setIsPickerOpen(true);
  };

  const closePicker = () => {
    setIsQuickReactionOpen(false);
    setIsPickerOpen(false);
  };

  const openQuickreaction = () => {
    setIsQuickReactionOpen(true);
  };

  const closeQuickreaction = () => {
    setIsQuickReactionOpen(false);
  };

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

  const otherUser =
    channel.id === `saved-${loggedUser.id}`
      ? { user: loggedUser, userId: loggedUser.id }
      : channel?.members?.filter(
          (member) => member.userId !== loggedUser.id,
        )[0];
  const messageType: MessageType = message.type;

  const sender =
    message.sender?.id === loggedUser.id
      ? "Vous"
      : otherUser?.user?.displayName.split(" ")[0];
  const recipient = message.recipient;
  let newMemberMsg, oldMemberMsg;

  const senderMember = channel.members.find(
    (member) => member.userId === message.sender?.id,
  );

  if (recipient && channel.isGroup) {
    const memberName = recipient.displayName.split(" ")[0];
    // Check if message type is info of added member
    if (messageType === "NEWMEMBER") {
      newMemberMsg = `Nouveau membre : ${memberName}`;
      if (message.sender) {
        message.sender.id === loggedUser.id
          ? (newMemberMsg = `Vous avez ajouté ${memberName} au groupe.`)
          : (newMemberMsg = `${sender} ${recipient.id === loggedUser.id ? "vous a ajouté" : `a ajouté ${memberName}`} au groupe.`);
      }
    }
    if (messageType === "LEAVE") {
      oldMemberMsg = `${memberName} est parti`;
      if (message?.sender) {
        message.sender.id === loggedUser.id
          ? (oldMemberMsg = `Vous avez retiré ${memberName} du groupe.`)
          : (oldMemberMsg = `${sender} ${recipient.id === loggedUser.id ? "vous a retiré" : `a retiré ${memberName}`} du groupe.`);
      }
    }
    if (messageType === "BAN") {
      oldMemberMsg = `${memberName} a été suspendu`;
      if (message?.sender) {
        message.sender.id === loggedUser.id
          ? (oldMemberMsg = `Vous avez suspendu ${memberName} du groupe.`)
          : (oldMemberMsg = `${sender} ${recipient.id === loggedUser.id ? "vous a suspendu" : `a suspendu ${memberName}`} du groupe.`);
      }
    }
  }

  const contentsTypes = {
    CREATE: channel.isGroup
      ? `${sender || ""} ${message.sender?.id === loggedUser.id ? "avez" : "a"} créé ce groupe`
      : otherUser.userId === loggedUser.id
        ? "Envoyez-vous un message"
        : `${otherUser.user?.displayName?.split(" ")[0] || ""} peut vous envoyer un message`,
    CONTENT: message.content,
    CLEAR: "Historique effacé",
    DELETE: "Discussion supprimée",
    SAVED: "Envoyez-vous un message",
    NEWMEMBER: newMemberMsg,
    LEAVE: oldMemberMsg,
    BAN: oldMemberMsg,
  };

  if (
    (message.recipientId === loggedUser.id && message.type === "BAN") ||
    message.type === "LEAVE"
  ) {
    const queryKey = ["chat", channelId];

    queryClient.invalidateQueries({ queryKey });
  }

  const messageDate = new Date(message.createdAt);
  const currentDate = new Date();
  const timeDifferenceInDays = Math.floor(
    (currentDate.getTime() - messageDate.getTime()) / (24 * 60 * 60 * 1000),
  );

  const messageContent = contentsTypes[messageType];

  const isOwner = message.senderId === loggedUser.id;
  return messageType !== "CONTENT" ? (
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
  ) : (
    <div
      className={cn(
        "relative flex w-full flex-col gap-2",
        (isQuickReactionOpen || isPickerOpen) && "z-10",
      )}
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
        <div className={"group/message relative w-fit max-w-[75%]"}>
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
              onOpenChange={toggleContextOpenChange}
              onReactOpen={openQuickreaction}
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
                      : "bg-accent",
                    !message.content && "bg-transparent",
                  )}
                >
                  {message.content ?? (
                    <span className="italic">Message non disponibe</span>
                  )}
                </p>
              </Linkify>
              <div
                className={cn(
                  "invisible absolute -top-[50%] h-fit w-fit opacity-0 transition-all",
                  isOwner ? "right-0" : "left-0",
                  isQuickReactionOpen && "visible opacity-100",
                )}
              >
                <div
                  className={cn(
                    "fixed inset-0 h-full w-full",
                    !isQuickReactionOpen && "invisible",
                  )}
                  onClick={closeQuickreaction}
                ></div>
                {isQuickReactionOpen && (
                  <QuickReaction
                    onPickerOpen={openPicker}
                    onReact={addReaction}
                    className={cn(
                      "*:animate-scale",
                      !isQuickReactionOpen && "*:animate-scale-down",
                    )}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        className={cn(
          "flex w-full select-none overflow-hidden px-4 text-justify text-xs transition-all",
          !showDetail ? "h-0 opacity-0" : "opacity-100",
          message.senderId === loggedUser.id ? "flex-row-reverse" : "ps-10",
        )}
        onClick={toggleCheck}
      >
        <p
          className={cn(
            showTime && "rounded-sm bg-primary/30 p-0.5 px-2",
            showDetail ? "animate-scale" : "hidden",
            "max-h-40 w-fit max-w-[50%] text-ellipsis *:font-bold",
          )}
        >
          {!!views.length ? (
            channel.isGroup ? (
              <>
                <span>Vu</span> par {views.join(",")}
              </>
            ) : (
              <span>Vu</span>
            )
          ) : (
            <span>{message.senderId === loggedUser.id ? "Envoyé" : "Vu"}</span>
          )}
        </p>
      </div>
    </div>
  );
}

interface QuickReactionProps {
  onReact: (reaction: string) => void;
  onPickerOpen: () => void;
  className?: string;
}

function QuickReaction({
  onReact,
  onPickerOpen,
  className,
}: QuickReactionProps) {
  const reactions = ["❤️", "😆", "😮", "😢", "😡", "👎"];

  return (
    <div
      className={cn(
        "flex flex-shrink-0 items-center gap-0.5 rounded-3xl bg-card/50 p-0.5",
        className,
      )}
    >
      {reactions.map((reaction, index) => (
        <Button
          variant="ghost"
          className="rounded-full max-sm:bg-accent"
          size="icon"
          onClick={() => onReact(reaction)}
          key={index}
        >
          <span className="text-2xl">{reaction}</span>
        </Button>
      ))}
      <Button
        variant="ghost"
        className="rounded-full max-sm:bg-accent"
        size="icon"
        onClick={onPickerOpen}
      >
        <Plus />
      </Button>
    </div>
  );
}
