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
import AppLogo from "@/components/AppLogo";
import { t } from "@/context/LanguageContext";
import { useProgress } from "@/context/ProgressContext";

export default function Messages() {
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(
    null,
  );
  const [newChat, setNewChat] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<ChannelData>();
  const { user } = useSession();
  const { activeChannelId, setActiveChannelId } = useActiveChannel();
  const queryClient = useQueryClient();
  const { startNavigation: navigate } = useProgress();
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
      className={cn(
        "flex h-full rounded-2xl bg-card shadow-sm transition-all max-sm:relative max-sm:h-full max-sm:w-screen max-sm:bg-transparent",
        (activeChannelId || newChat) && "max-sm:translate-x-[-100vw]",
      )}
    >
      <div className="h-full w-screen min-w-60 max-sm:min-w-[100vw] sm:w-1/3 sm:border-r-2">
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
        className={"relative flex h-full w-screen flex-col max-sm:min-w-[100vw] sm:w-3/4"}
      >
        {!activeChannelId && (
          <div className="flex h-full select-none flex-col items-center justify-center px-4 text-center">
            <div className="text-muted-foreground/50">
              <AppLogo
                logo="LOGO"
                size={150}
                className="text-muted-foreground/50"
              />
            </div>
            <h2 className="text-xl">{messagesOnApp}</h2>
            <p className="text-muted-foreground">{selectChatToStart}</p>
          </div>
        )}
        <Chat
          channelId={activeChannelId || selectedChannelId}
          initialData={selectedChannel}
          onClose={() => {
            navigate(`/messages`);
            setSelectedChannelId(null);
            setSelectedChannel(undefined);
            setActiveChannelId(null);
          }}
        />
        <NewChat
          onClose={closeNewChat}
          onChatStart={(id)=>{
            if (activeChannelId !== id) {
              setSelectedChannelId(null);
              setSelectedChannel(undefined);
              setActiveChannelId(null);
            }
            setActiveChannelId(id);
          }}
          className={cn(
            !newChat && "pointer-events-none select-none opacity-0",
            "z-20",
          )}
        />
      </div>
    </div>
  );
}
