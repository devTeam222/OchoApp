"use client";

import UserAvatar from "@/components/UserAvatar";
import { ChannelData, MessageData } from "@/lib/types";
import { UsersRound } from "lucide-react";
import { useSession } from "../SessionProvider";
import GroupAvatar from "@/components/GroupAvatar";

interface ChannelProps {
  channel: ChannelData;
  active: boolean;
  onSelect: () => void;
}

export default function Channel({ channel, active, onSelect }: ChannelProps) {
  const { user: loggedinUser } = useSession();

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

  const messageType = messagePreview?.type;

  const sender =
    messagePreview.sender?.id === loggedinUser.id
      ? "Vous"
      : channel.isGroup
        ? messagePreview.sender?.displayName.split(" ")[0]
        : otherUser?.displayName.split(" ")[0];
  const recipient = channel?.messages[0]?.recipient || null;
  let newMemberMsg;

  if (recipient && channel.isGroup) {
    const newMemberName = recipient.displayName.split(" ")[0];
    // Check if message type is info of added member
    if (messageType === "NEWMEMBER") {
      newMemberMsg = `Nouveau membre : ${newMemberName}`;
      if (channel?.messages[0].sender) {
        channel?.messages[0].sender.id === loggedinUser.id
          ? (newMemberMsg = `Vous avez ajouté ${newMemberName} au groupe.`)
          : (newMemberMsg = `${sender} ${recipient.id === loggedinUser.id ? "vous a ajouté" : `a ajouté ${newMemberName}`} au groupe.`);
      }
    }
  }

  const contentsTypes = {
    CREATE: channel.isGroup
      ? `${sender} ${messagePreview.sender?.id === loggedinUser.id ? "avez" : "a"} créé ce groupe`
      : `${otherUser?.displayName.split(" ")[0] || ""} peut maintenant discuter avec vous`,
    CONTENT: `${sender || ""}: ${messagePreview.content.length > 50 ? messagePreview.content.slice(0, 50) : messagePreview.content}`,
    CLEAR: "Historique non disponible",
    DELETE: "Discussion supprimée",
    SAVED: "Envoyez-vous un message",
    NEWMEMBER: newMemberMsg,
  };

  const messagePreviewContent = contentsTypes[messageType];

  return (
    <li
      key={channel.id}
      className={`cursor-pointer p-2 ${active && "bg-primary/10"}`}
      onClick={onSelect}
    >
      <div className="flex items-center space-x-2">
        {channel.isGroup ? (
          <GroupAvatar size={40} />
        ) : (
          <UserAvatar avatarUrl={otherUser?.avatarUrl} size={40} />
        )}
        <div>
          <span className="font-semibold">
            {channel.name ||
              `${otherUser?.displayName} ${channel.id === `saved-${loggedinUser.id}` ? "(vous)" : ""}` ||
              (channel.isGroup
                ? "Groupe de discussion"
                : "Utilisateur OchoApp")}
          </span>
          <p
            className={`line-clamp-1 text-ellipsis text-sm ${messageType === "CONTENT" ? "text-muted-foreground" : "italic text-primary"}`}
          >
            {messagePreviewContent || "Aucun message"}
          </p>
        </div>
      </div>
    </li>
  );
}
