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

  const queryKey: QueryKey = ["reads-info", message.id];

  const { data } = useQuery({
    queryKey,
    queryFn: () =>
      kyInstance.get(`/api/message/${messageId}/read`).json<ReadInfo>(),
    staleTime: Infinity,
  });

  const { reads } = data ?? { reads: [] };

  useQuery({
    queryKey,
    queryFn: () => {
      const isRead = !!reads.find((read) => read.id === loggedUser.id);
      !isRead && kyInstance.post(`/api/message/${messageId}/read`);
    },
    throwOnError: false,
  });

  const showDetail = isChecked || showTime;

  function toggleCheck() {
    setIsChecked(!isChecked);
  }

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
    <div className="relative flex w-full flex-col gap-2">
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
        <div className={"relative w-fit max-w-[75%]"} onClick={toggleCheck}>
          {message.senderId !== loggedUser.id && (
            <div className="ps-2 text-sm text-muted-foreground">
              {message.sender?.displayName || "Utilisateur OchoApp"}
            </div>
          )}
          <Linkify>
            <p
              className={cn(
                "w-fit rounded-3xl px-4 py-2 *:font-bold",
                message.senderId === loggedUser.id
                  ? "bg-primary text-primary-foreground *:text-primary-foreground"
                  : "bg-accent",
              )}
            >
              {message.content}
            </p>
          </Linkify>
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
