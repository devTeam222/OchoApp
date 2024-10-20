"use client";

import { Button } from "@/components/ui/button";
import { Bookmark, Home, MessageSquareMore, Search } from "lucide-react";
import Link from "next/link";
import NotificationsButton from "./NotificationsButton";
import { useSession } from "./SessionProvider";
import { useSearch } from "@/context/SearchContext"; // Import the SearchContext

interface MenuBarProps {
  className?: string;
}

export default function MenuBar({ className }: MenuBarProps) {
  const { user } = useSession();
  const { setSearchActive } = useSearch(); // Use the setSearchActive from the context

  if (!user) return null;

  function handleSearchClick() {
    setSearchActive(true); // Activate search mode globally
  }

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

      <Button
        variant="ghost"
        className="flex items-center justify-start gap-3"
        title="Recherche"
        asChild
        onClick={handleSearchClick} // Trigger search activation when clicked
      >
        <Link href="/search">
          <Search />
          <span className="hidden lg:inline">Recherche</span>
        </Link>
      </Button>

      <NotificationsButton initialState={{ unreadCount: 0 }} />

      <Button
        variant="ghost"
        className="flex items-center justify-start gap-3"
        title="Messages"
        asChild
      >
        <Link href="/messages">
          <MessageSquareMore />
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
