"use client"

import { Button } from "@/components/ui/button";
import { Bookmark, Home, MessageCircleMore } from "lucide-react";
import Link from "next/link";
import NotificationsButton from "./NotificationsButton";
import { useSession } from "./SessionProvider";

interface MenuBarProps {
  className?: string;
}

export default function MenuBar({ className }: MenuBarProps) {
  const { user } = useSession();

  if(!user) return null;
  return (
    <div className={className}>
      <Button
        variant="ghost"
        className="flex items-center justify-start gap-3"
        title="Accueil"
        asChild
      >
        <Link href="/">
          <Home />
          <span className="hidden lg:inline">Accueil</span>
        </Link>
      </Button>
      <NotificationsButton initialState={{unreadCount: 0}}/>
      <Button
        variant="ghost"
        className="flex items-center justify-start gap-3"
        title="Messages"
        asChild
      >
        <Link href="/messages">
          <MessageCircleMore />
          <span className="hidden lg:inline">Messages</span>
        </Link>
      </Button>
      <Button
        variant="ghost"
        className="flex items-center justify-start gap-3"
        title="Favoris"
        asChild
      >
        <Link href="/bookmarks">
          <Bookmark />
          <span className="hidden lg:inline">Favoris</span>
        </Link>
      </Button>
    </div>
  );
}
