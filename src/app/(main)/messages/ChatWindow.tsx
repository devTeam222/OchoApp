"use client";

import { useState } from "react";
import { useSession } from "../SessionProvider";
import SideBar from "./SideBar";
import { ChannelData } from "@/lib/types";
import ActiveChat from "./ActiveChat";
import { useActiveChannel } from "@/context/ActiveChatContext";
import NewChat from "./NewChat";
import { cn } from "@/lib/utils";

export default function ChatWindow() {
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(
    null,
  );
  const [newChat, setNewChat] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<ChannelData>();
  const { user } = useSession();
  const { setActiveChannelId } = useActiveChannel();

  if (!user) {
    return null;
  }

  const handleChannelSelect = (channelId: string) => {
    setSelectedChannelId(channelId);
  };
  const closeNewChat = () => {
    setNewChat(false);
  };

  return (
    <div
      className={`flex h-full rounded-2xl bg-card shadow-sm transition-all max-sm:relative max-sm:h-full max-sm:w-screen max-sm:bg-transparent ${(selectedChannelId && selectedChannel || newChat) && "max-sm:translate-x-[-100vw]"}`}
    >
      <div className="h-full w-screen min-w-60 max-sm:min-w-[100vw] sm:w-1/4 sm:border-r-2">
        <SideBar
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
        className={`relative flex h-full w-screen flex-col max-sm:min-w-[100vw] sm:w-3/4 ${!(selectedChannelId && selectedChannel || newChat) && "max-sm:hidden"}`}
      >
        {selectedChannelId && selectedChannel ? (
          <ActiveChat
            channelId={selectedChannelId}
            initialData={selectedChannel}
            onClose={() => {
              setSelectedChannelId(null);
              setSelectedChannel(undefined);
              setActiveChannelId(null);
            }}
          />
        ) : (
          <div className="flex h-full select-none items-center justify-center px-3 text-center text-muted-foreground">
            <p>Sélectionnez une discussion pour commencer.</p>
          </div>
        )}
        <NewChat
          onClose={closeNewChat}
          className={cn(
            !newChat && "pointer-events-none select-none opacity-0",
            "z-20"
          )}
        />
      </div>
    </div>
  );
}
