"use client"

import { createContext, useContext, useEffect, useState } from "react";

interface ActiveChatContextType {
  activeChannelId: string | null;
  setActiveChannelId: (id: string | null) => void;
}

const ActiveChatContext = createContext<ActiveChatContextType | undefined>(
  undefined,
);

export const useActiveChannel = () => {
  const context = useContext(ActiveChatContext);
  if (!context) {
    throw new Error(
      "useActiveChannel must be used within an ActiveChatProvider",
    );
  }
  return context;
};

export const ActiveChatProvider = ({
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
    <ActiveChatContext.Provider value={{ activeChannelId, setActiveChannelId }}>
      {children}
    </ActiveChatContext.Provider>
  );
};
