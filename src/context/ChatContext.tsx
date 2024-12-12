"use client"

import { createContext, useContext, useEffect, useState } from "react";

interface ChatContextType {
  activeChannelId: string | null;
  setActiveChannelId: (id: string | null) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(
  undefined,
);

export const useActiveChannel = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error(
      "useActiveChannel must be used within an ChatProvider",
    );
  }
  return context;
};

export const ChatProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [activeChannelId, setActiveChannelId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("activeChannelId") || null;
    }
    return null;
  });

  useEffect(() => {
    // Mettre à jour sessionStorage lorsque activeChannelId change
    activeChannelId
      ? sessionStorage.setItem("activeChannelId", activeChannelId)
      : sessionStorage.removeItem("activeChannelId");
  }, [activeChannelId]);

  return (
    <ChatContext.Provider value={{ activeChannelId, setActiveChannelId }}>
      {children}
    </ChatContext.Provider>
  );
};
