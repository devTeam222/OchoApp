"use client";

import UserAvatar from "@/components/UserAvatar";
import { ChannelData, NotificationCountInfo } from "@/lib/types";
import { useSession } from "../SessionProvider";
import GroupAvatar from "@/components/GroupAvatar";
import { MessageType } from "@prisma/client";
import Time from "@/components/Time";
import { cn } from "@/lib/utils";
import { QueryKey, useQuery, useQueryClient } from "@tanstack/react-query";
import kyInstance from "@/lib/ky";
import FormattedInt from "@/components/FormattedInt";
import { usePathname, useRouter } from "next/navigation";

interface ChannelProps {
  channel: ChannelData;
  active: boolean;
  onSelect: () => void;
}

export default function Channel({ channel, active, onSelect }: ChannelProps) {
  const { user: loggedinUser } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const queryKey: QueryKey = ["unread-chat-messages", channel.id];
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey,
    queryFn: () =>
      kyInstance
        .get(`/api/messages/${channel.id}/unread-count`)
        .json<NotificationCountInfo>(),
    refetchInterval: active ? 2_000 : 50_000,
    initialData: { unreadCount: 0 },
    throwOnError: false,
  });

  const { unreadCount } = data;

  const otherUser =
    channel.id === `saved-${loggedinUser.id}`
      ? loggedinUser
      : channel?.members.filter(
          (member) => member.userId !== loggedinUser.id,
        )[0].user;

  const messagePreview = channel?.messages[0] || {
    id: "",
    content: "",
    senderId: null,
    sender: null,
    channelId: channel.id,
    type: "CLEAR",
    createdAt: Date.now(),
  };

  let messageType: MessageType = messagePreview?.type;
  const isSender = messagePreview.sender?.id === loggedinUser.id;
  const currentMember = channel.members.find(
    (member) => member.userId === loggedinUser.id,
  );

  const sender = isSender
    ? "Vous"
    : channel.isGroup
      ? messagePreview.sender?.displayName.split(" ")[0]
      : otherUser?.displayName.split(" ")[0];
  const recipient = channel?.messages[0]?.recipient || null;
  let newMemberMsg, oldMemberMsg;

  if (recipient && channel.isGroup) {
    const memberName = recipient.displayName.split(" ")[0];
    // Check if message type is info of added member
    if (messageType === "NEWMEMBER") {
      newMemberMsg = `Nouveau membre : ${memberName}`;
      if (channel?.messages[0].sender) {
        channel?.messages[0].sender.id === loggedinUser.id
          ? (newMemberMsg = `Vous avez ajouté ${memberName} au groupe.`)
          : (newMemberMsg = `${sender} ${recipient.id === loggedinUser.id ? "vous a ajouté" : `a ajouté ${memberName}`} au groupe.`);
      }
    }
    if (messageType === "LEAVE") {
      oldMemberMsg = `${memberName} a quitté le groupe`;
      if (channel?.messages[0].sender) {
        channel?.messages[0].sender.id === loggedinUser.id
          ? (oldMemberMsg = `Vous avez retiré ${memberName} du groupe.`)
          : (oldMemberMsg = `${sender} ${recipient.id === loggedinUser.id ? "vous a retiré" : `a retiré ${memberName}`} au groupe.`);
      }
    }
    if (messageType === "BAN") {
      oldMemberMsg = `${memberName} a été suspendu`;
      if (channel?.messages[0].sender) {
        channel?.messages[0].sender.id === loggedinUser.id
          ? (oldMemberMsg = `Vous avez suspendu ${memberName} du groupe.`)
          : (oldMemberMsg = `${sender} ${recipient.id === loggedinUser.id ? "vous a suspendu" : `a suspendu ${memberName}`} du groupe.`);
      }
    }
  }
  const showUserPreview = channel.isGroup || isSender;

  const contentsTypes = {
    CREATE: channel.isGroup
      ? `${sender} ${messagePreview.sender?.id === loggedinUser.id ? "avez" : "a"} créé ce groupe`
      : `${otherUser?.displayName.split(" ")[0] || ""} peut maintenant discuter avec vous`,
    CONTENT: `${showUserPreview ? sender || "" : ""}${showUserPreview ? ": " : ""}${messagePreview.content.length > 100 ? messagePreview.content.slice(0, 100) : messagePreview.content}`,
    CLEAR: "Aperçu non disponible",
    DELETE: "Discussion supprimée",
    SAVED: "Envoyez-vous un message",
    NEWMEMBER: newMemberMsg,
    LEAVE: oldMemberMsg,
    BAN: oldMemberMsg,
    REACTION: `${sender || ""} ${isSender ? "avez" : "a"} réagi ${messagePreview.content} ${isSender ? `au message de ${messagePreview.recipient?.displayName.split(" ")[0] || "Utilisateur OchoApp"}` : "à votre message"}`,
  };

  let messagePreviewContent = contentsTypes[messageType];

  if (currentMember?.type === "OLD" || currentMember?.type === "BANNED") {
    messagePreviewContent = "Vous ne pouvez plus interagir";
    messageType = "CLEAR";
  }

  const now = Date.now();

  const isUserOnline =
    channel.id === `saved-${loggedinUser.id}` ||
    (!!otherUser?.lastSeen &&
      new Date(otherUser.lastSeen).getTime() - 40 * 1000 > now);

  const select = async () => {
    onSelect();
    queryClient.setQueryData(["unread-chat-messages", channel.id], {
      unreadCount: 0,
    });
    router.push("/messages/chat");
  };

  return (
    <li
      key={channel.id}
      className={`cursor-pointer p-2 ${active && "bg-accent/50"}`}
      onClick={select}
      title={messagePreviewContent || "Aucun message"}
    >
      <div className="flex items-center space-x-2">
        {channel.isGroup ? (
          <GroupAvatar size={45} />
        ) : (
          <UserAvatar
            avatarUrl={otherUser?.avatarUrl}
            size={45}
            online={isUserOnline}
          />
        )}
        <div className="">
          <span className="font-semibold">
            {channel.name ||
              `${otherUser?.displayName || "Utilisateur OchoApp"} ${channel.id === `saved-${loggedinUser.id}` ? "(vous)" : ""}` ||
              (channel.isGroup
                ? "Groupe de discussion"
                : "Utilisateur OchoApp")}
          </span>
          <div className="flex w-fit max-w-full flex-shrink-0 items-center gap-1 text-sm text-muted-foreground">
            <span
              className={cn(
                "line-clamp-2 text-ellipsis",
                messageType !== "CONTENT" && "text-xs text-primary",
              )}
            >
              {messagePreviewContent || "Aucun message"}
            </span>
            <span>•</span>
            <span className="line-clamp-1 min-w-fit">
              <Time time={messagePreview.createdAt} full={false} />
            </span>
          </div>
        </div>
        {!!unreadCount && (
          <span className="relative flex flex-1 items-center justify-end">
            <span className="relative min-w-fit rounded-full bg-primary px-1 text-xs font-medium tabular-nums text-primary-foreground">
              <FormattedInt number={unreadCount} />
            </span>
          </span>
        )}
      </div>
    </li>
  );
}
