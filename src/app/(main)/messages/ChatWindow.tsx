"use client";

import { useState } from "react";
import { useSession } from "../SessionProvider";
import ChatList from "./ChatList";
import { ChannelData } from "@/lib/types";
import Chat from "./Chat";
import { useActiveChannel } from "@/context/ChatContext";
import NewChat from "./NewChat";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import AppLogo from "@/components/AppLogo";
import { t } from "@/context/LanguageContext";

export default function ChatWindow() {
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(
    null,
  );
  const [newChat, setNewChat] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<ChannelData>();
  const { user } = useSession();
  const { setActiveChannelId } = useActiveChannel();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { messagesOnApp, selectChatToStart } = t();

  if (!user) {
    return null;
  }

  const handleChannelSelect = (channelId: string) => {
    queryClient.invalidateQueries({ queryKey: ["unread-chat-messages"] });
    queryClient.invalidateQueries({ queryKey: ["unread-messages"] });
    setSelectedChannelId(channelId);
  };
  const closeNewChat = () => {
    setNewChat(false);
  };

  return (
    <div
      className={`flex h-full rounded-2xl bg-card shadow-sm transition-all max-sm:relative max-sm:h-full max-sm:w-screen max-sm:bg-transparent ${((selectedChannelId && selectedChannel) || newChat) && "max-sm:translate-x-[-100vw]"}`}
    >
      <div className="h-full w-screen min-w-60 max-sm:min-w-[100vw] sm:w-1/4 sm:border-r-2">
        <ChatList
          onChannelSelect={handleChannelSelect}
          activeChannel={(channel) => setSelectedChannel(channel)}
          selectedChannelId={selectedChannelId}
          onNewChat={() => setNewChat(true)}
          onCloseChat={() => {
            setSelectedChannelId(null);
            setSelectedChannel(undefined);
            setActiveChannelId(null);
          }}
        />
      </div>
      <div
        className={`relative flex h-full w-screen flex-col max-sm:min-w-[100vw] sm:w-3/4 ${!((selectedChannelId && selectedChannel) || newChat) && "max-sm:hidden"}`}
      >
        {selectedChannelId && selectedChannel ? (
          <Chat
            channelId={selectedChannelId}
            initialData={selectedChannel}
            onClose={() => {
              router.push(`/messages`);
              setSelectedChannelId(null);
              setSelectedChannel(undefined);
              setActiveChannelId(null);
            }}
          />
        ) : (
          <div className="flex h-full select-none flex-col items-center justify-center px-4 text-center">
            <AppLogo
              logo="LOGO"
              size={150}
              className="text-muted-foreground/50"
            />
            <h2 className="text-xl">{messagesOnApp}</h2>
            <p className="text-muted-foreground">{selectChatToStart}
            </p>
          </div>
        )}
        <NewChat
          onClose={closeNewChat}
          className={cn(
            !newChat && "pointer-events-none select-none opacity-0",
            "z-20",
          )}
        />
      </div>
    </div>
  );
}
