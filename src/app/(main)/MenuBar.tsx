"use client";

import { Button } from "@/components/ui/button";
import { Compass, Home, Search, Settings, Settings2Icon } from "lucide-react";
import Link from "next/link";
import NotificationsButton from "./NotificationsButton";
import { useSession } from "./SessionProvider";
import { useSearch } from "@/context/SearchContext";
import { useNavigation } from "@/context/NavigationContext";
import { cn } from "@/lib/utils";
import MessagesButton from "./MessagesButton";
import { t } from "@/context/LanguageContext";
import { VocabularyKey } from "@/lib/vocabulary";

interface MenuBarProps {
  className?: string;
}

export default function MenuBar({ className }: MenuBarProps) {
  const { user } = useSession();
  const { setSearchActive } = useSearch();
  const { currentNavigation, setCurrentNavigation } = useNavigation();
  const vocabulary: VocabularyKey[] = [
      "home",
      "explore",
      "search",
      "activity",
      "notifications",
      "messages",
      "settings",
      "menu",
    ];
  
    const {
      home,
      explore,
      search,
      activity,
      notifications,
      dark,
      settings,
      menu
    } = t(vocabulary);

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

  function setSettingsNav() {
    setCurrentNavigation("settings");
  }

  return (
    <div className={className}>
      <Button
        variant="ghost"
        className={cn(
          "flex items-center justify-start max-sm:h-fit max-sm:flex-1 max-sm:p-1.5 sm:gap-3",
          currentNavigation === "home" &&
            "bg-accent text-primary hover:text-primary",
        )}
        title={home}
        asChild
        onClick={setHomeNav}
      >
        <Link href="/" className="items-center max-sm:flex max-sm:flex-col">
          <Home />
          <span className="text-xs sm:hidden">{home}</span>
          <span className="max-lg:hidden">{home}</span>
        </Link>
      </Button>
      <Button
        variant="ghost"
        className={cn(
          "flex items-center justify-start max-sm:h-fit max-sm:flex-1 max-sm:p-1.5 sm:hidden sm:gap-3",
          currentNavigation === "explore" &&
            "bg-accent text-primary hover:text-primary",
        )}
        title={explore}
        onClick={handleSearchClick} // Trigger search activation when clicked
        asChild
      >
        <Link
          href="/explore"
          className="items-center max-sm:flex max-sm:flex-col"
        >
          <Compass />
          <span className="text-xs">{explore}</span>
        </Link>
      </Button>
      <Button
        variant="ghost"
        className={cn(
          "flex items-center justify-start max-sm:hidden max-sm:h-fit max-sm:flex-1 max-sm:p-1.5 sm:gap-3",
          currentNavigation === "explore" &&
            "bg-accent text-primary hover:text-primary",
        )}
        title={search}
        onClick={handleSearchClick} // Trigger search activation when clicked
        asChild
      >
        <Link href="/search" className="">
          <Search />
          <span className="max-lg:hidden">{search}</span>
        </Link>
      </Button>

      <NotificationsButton
        initialState={{ unreadCount: 0 }}
        onClick={setActivityNav}
        className={cn(
          currentNavigation === "activity" &&
            "bg-accent text-primary hover:text-primary",
        )}
      />
      <MessagesButton
        initialState={{ unreadCount: 0 }}
        onClick={setMessagesNav}
        className={cn(
          currentNavigation === "messages" &&
            "bg-accent text-primary hover:text-primary",
        )}
      />
      <Button
        variant="ghost"
        className={cn(
          "flex items-center justify-start max-sm:h-fit max-sm:flex-1 max-sm:p-1.5 sm:hidden sm:gap-3",
          currentNavigation === "settings" &&
            "bg-accent text-primary hover:text-primary",
        )}
        title={menu}
        asChild
        onClick={setSettingsNav}
      >
        <Link
          href="/settings"
          className="items-center max-sm:flex max-sm:flex-col"
        >
          <Settings2Icon />
          <span className="text-xs">{menu}</span>
        </Link>
      </Button>
      <Button
        variant="ghost"
        className={cn(
          "flex items-center justify-start max-sm:hidden max-sm:h-fit max-sm:flex-1 max-sm:p-1.5 sm:gap-3",
          currentNavigation === "settings" &&
            "bg-accent text-primary hover:text-primary",
        )}
        title={settings}
        asChild
        onClick={setSettingsNav}
      >
        <Link
          href="/settings"
          className="items-center max-sm:flex max-sm:flex-col"
        >
          <Settings className="max-sm" />
          <span className="max-lg:hidden">{settings}</span>
        </Link>
      </Button>
    </div>
  );
}
