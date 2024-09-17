// "use client"

import UserAvatar from "@/components/UserAvatar";
import { ChannelData, MessageData } from "@/lib/types";
import { useSession } from "../SessionProvider";
import Linkify from "@/components/Linkify";

type MessageProps = {
  message: MessageData;
  channel: ChannelData;
};

export default function Message({ message, channel }: MessageProps) {
  const { user: loggedUser } = useSession();

  if (!loggedUser) {
    // Redirection ou message d'erreur si l'utilisateur n'est pas authentifié
    return <p>Veuillez vous connecter pour accéder à vos discussions.</p>;
  }
  const otherUser =
    channel.id === `saved-${loggedUser.id}`
      ? { user: loggedUser, userId: loggedUser.id }
      : channel?.members?.filter(
          (member) => member.userId !== loggedUser.id,
        )[0];
  const messageType = message.type;

  const sender =
    message.sender?.id === loggedUser.id
      ? "Vous"
      : otherUser?.user?.displayName.split(" ")[0];
  const recipient = message.recipient;
  let newMemberMsg;

  if (recipient && channel.isGroup) {
    const newMemberName = recipient.displayName.split(" ")[0];
    // Check if message type is info of added member
    if (messageType === "NEWMEMBER") {
      newMemberMsg = `Nouveau membre : ${newMemberName}`;
      if (message.sender) {
        message.sender.id === loggedUser.id
          ? (newMemberMsg = `Vous avez ajouté ${newMemberName} au groupe.`)
          : (newMemberMsg = `${sender} ${recipient.id === loggedUser.id ? "vous a ajouté" : `a ajouté ${newMemberName}`} au groupe.`);
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
  };

  const messageContent = contentsTypes[messageType];
  const content =
    messageType !== "CONTENT" ? (
      <div
        className={`sticky top-0 flex justify-center text-center text-sm text-primary ${messageType === "CREATE" ? "flex-1" : ""}`}
      >
        {messageContent}
      </div>
    ) : (
      <div
        className={`flex w-full gap-2 ${message.senderId === loggedUser.id ? "flex-row-reverse" : ""}`}
      >
        {message.senderId !== loggedUser.id && (
          <span className="py-2">
            <UserAvatar
              avatarUrl={message.sender?.avatarUrl}
              size={18}
              className="flex-none"
            />
          </span>
        )}
        <div className={"relative w-fit max-w-[75%]"}>
          {message.senderId !== loggedUser.id && (
            <div className="ps-2 text-sm font-thin text-muted-foreground">
              {message.sender?.displayName || "Utilisateur OchoApp"}
            </div>
          )}
          <Linkify>
            <p
              className={`w-fit rounded-3xl px-4 py-2 *:font-bold ${message.senderId === loggedUser.id ? "bg-primary text-primary-foreground *:text-primary-foreground" : "bg-muted"}`}
            >
              {message.content}
            </p>
          </Linkify>
        </div>
      </div>
    );
  return content;
}
