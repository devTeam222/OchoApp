"use client";

import { useState } from "react";
import { useSession } from "../SessionProvider";
import SideBar from "./SideBar";
import { ChannelData } from "@/lib/types";
import ActiveChat from "./ActiveChat";

export default function ChatWindow() {
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(
    null,
  );
  const [selectedChannel, setSelectedChannel] = useState<ChannelData>();
  const { user } = useSession();

  if (!user) {
    // Redirection ou message d'erreur si l'utilisateur n'est pas authentifié
    return <p>Veuillez vous connecter pour accéder à vos discussions.</p>;
  }

  const handleChannelSelect = (channelId: string) => {
    setSelectedChannelId(channelId);
  };

  return (
    <div
      className={`flex h-full rounded-2xl bg-card shadow-sm transition-all max-sm:relative max-sm:h-full max-sm:w-screen max-sm:bg-transparent ${selectedChannelId && selectedChannel && "max-sm:translate-x-[-100vw]"}`}
    >
      <div className="w-screen h-full min-w-60 max-sm:min-w-[100vw] sm:w-1/4 sm:border-r-2">
        <SideBar
          onChannelSelect={handleChannelSelect}
          activeChannel={(channel) => setSelectedChannel(channel)}
          selectedChannelId={selectedChannelId}
          onCloseChat={()=>{
            setSelectedChannelId(null);
            setSelectedChannel(undefined);
            localStorage.removeItem("activeChannelId");
          }}
        />
      </div>
      <div className={`relative flex w-screen flex-col h-full max-sm:min-w-[100vw] sm:w-3/4 ${!(selectedChannelId && selectedChannel) && "max-sm:hidden"}`}>
        {selectedChannelId && selectedChannel ? (
          <ActiveChat channelId={selectedChannelId} channel={selectedChannel} onClose={()=>{
            setSelectedChannelId(null);
            setSelectedChannel(undefined);
            localStorage.removeItem("activeChannelId");
          }} />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-center px-3 select-none">
            <p>Sélectionnez une discussion pour commencer.</p>
          </div>
        )}
      </div>
    </div>
  );
}
