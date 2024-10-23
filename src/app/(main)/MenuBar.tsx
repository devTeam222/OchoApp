"use client";

import { Button } from "@/components/ui/button";
import {
  Bookmark,
  Compass,
  Home,
  MessageSquareMore,
  Search,
} from "lucide-react";
import Link from "next/link";
import NotificationsButton from "./NotificationsButton";
import { useSession } from "./SessionProvider";
import { useSearch } from "@/context/SearchContext";
import { useNavigation } from "@/context/NavigationContext";
import { cn } from "@/lib/utils";

interface MenuBarProps {
  className?: string;
}

export default function MenuBar({ className }: MenuBarProps) {
  const { user } = useSession();
  const { setSearchActive } = useSearch();
  const { currentNavigation, setCurrentNavigation } = useNavigation();

  if (!user) return null;

  function handleSearchClick() {
    setSearchActive(true);
    setCurrentNavigation("explore");
  }

  function setHomeNav() {
    setCurrentNavigation("home");
  }

  function setActivityNav() {
    setCurrentNavigation("activity");
  }

  function setMessagesNav() {
    setCurrentNavigation("messages");
  }

  function setBookmarksNav() {
    setCurrentNavigation("bookmarks");
  }

  return (
    <div className={className}>
      <Button
        variant="ghost"
        className={cn(
          "flex items-center justify-start max-sm:h-fit max-sm:p-1.5 sm:gap-3",
          currentNavigation === "home" && "text-primary hover:text-primary",
        )}
        title="Accueil"
        asChild
        onClick={setHomeNav}
      >
        <Link href="/" className="items-center max-sm:flex max-sm:flex-col">
          <Home />
          <span className="text-xs sm:hidden">Accueil</span>
          <span className="max-lg:hidden">Accueil</span>
        </Link>
      </Button>
      <Button
        variant="ghost"
        className={cn(
          "flex items-center justify-start max-sm:h-fit max-sm:p-1.5 sm:hidden sm:gap-3",
          currentNavigation === "explore" && "text-primary hover:text-primary",
        )}
        title="Recherche"
        onClick={handleSearchClick} // Trigger search activation when clicked
        asChild
      >
        <Link
          href="/explore"
          className="items-center max-sm:flex max-sm:flex-col"
        >
          <Compass />
          <span className="text-xs">Explorer</span>
        </Link>
      </Button>
      <Button
        variant="ghost"
        className={cn("flex items-center justify-start max-sm:hidden max-sm:h-fit max-sm:p-1.5 sm:gap-3", 
          currentNavigation === "explore" && "text-primary hover:text-primary",
        )}
        title="Recherche"
        onClick={handleSearchClick} // Trigger search activation when clicked
        asChild
      >
        <Link href="/search" className="">
          <Search />
          <span className="max-lg:hidden">Recherche</span>
        </Link>
      </Button>

      <NotificationsButton
        initialState={{ unreadCount: 0 }}
        onClick={setActivityNav}
        className={cn(
          currentNavigation === "activity" && "text-primary hover:text-primary"
        )}
      />

      <Button
        variant="ghost"
        className={cn(
          "flex items-center justify-start max-sm:h-fit max-sm:p-1.5 sm:gap-3",
          currentNavigation === "messages" && "text-primary hover:text-primary",
        )}
        title="Messages"
        asChild
        onClick={setMessagesNav}
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
        className={cn(
          "flex items-center justify-start max-sm:h-fit max-sm:p-1.5 sm:gap-3",
          currentNavigation === "bookmarks" && "text-primary hover:text-primary",
        )}
        title="Favoris"
        asChild
        onClick={setBookmarksNav}
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
