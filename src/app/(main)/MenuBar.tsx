"use client";

import { Button } from "@/components/ui/button";
import { Bookmark, Compass, Home, MessageSquareMore, Search } from "lucide-react";
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
        className="flex items-center justify-start max-sm:h-fit sm:gap-3"
        title="Accueil"
        asChild
      >
        <Link href="/" className="items-center max-sm:flex max-sm:flex-col">
          <Home />
          <span className="text-xs sm:hidden">Accueil</span>
          <span className="max-lg:hidden">Accueil</span>
        </Link>
      </Button>
      <Button
        variant="ghost"
        className="flex items-center justify-start max-sm:h-fit sm:gap-3"
        title="Recherche"
        onClick={handleSearchClick} // Trigger search activation when clicked
        asChild
      >
        <Link
          href="/search"
          className="items-center max-sm:flex max-sm:flex-col"
        >
          <Compass className="sm:hidden"/>
          <Search className="max-sm:hidden"/>
          <span className="text-xs sm:hidden">Explorer</span>
          <span className="max-lg:hidden">Recherche</span>
        </Link>
      </Button>

      <NotificationsButton initialState={{ unreadCount: 0 }} />

      <Button
        variant="ghost"
        className="flex items-center justify-start max-sm:h-fit sm:gap-3"
        title="Messages"
        asChild
      >
        <Link
          href="/messages"
          className="items-center max-sm:flex max-sm:flex-col"
        >
          <MessageSquareMore />
          <span className="text-xs sm:hidden">Messages</span>
          <span className="max-lg:hidden">Messages</span>
        </Link>
      </Button>
      <Button
        variant="ghost"
        className="flex items-center justify-start max-sm:h-fit sm:gap-3"
        title="Favoris"
        asChild
      >
        <Link
          href="/bookmarks"
          className="items-center max-sm:flex max-sm:flex-col"
        >
          <Bookmark />
          <span className="text-xs sm:hidden">Favoris</span>
          <span className="max-lg:hidden">Favoris</span>
        </Link>
      </Button>
    </div>
  );
}
