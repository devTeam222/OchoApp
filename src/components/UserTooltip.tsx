"use client";

import { useSession } from "@/app/(main)/SessionProvider";
import { FollowerInfo, UserData } from "@/lib/types";
import { PropsWithChildren, useEffect, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import Link from "next/link";
import UserAvatar from "./UserAvatar";
import FollowButton from "./FollowButton";
import Linkify from "./Linkify";
import FollowerCount from "./FollowerCount";
import { Button } from "./ui/button";
import { UserCircle2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

interface UserTooltipProps extends PropsWithChildren {
  user: UserData;
}

export default function UserTooltip({ children, user }: UserTooltipProps) {
  const { user: loggedInUser } = useSession();

  const followerState: FollowerInfo = {
    followers: user._count.followers,
    isFollowedByUser: !!user.followers.some(
      ({ followerId }) => followerId === loggedInUser.id,
    ),
  };

  const [useDialog, setUseDialog] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const isTouchScreen =
        "ontouchstart" in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.matchMedia("(max-width: 768px)").matches;
      setUseDialog(isTouchScreen || isSmallScreen);
    };

    handleResize(); // Set initial state
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const content = (
    <div>
      <div
        className={`flex max-w-80 ${user.id !== loggedInUser.id ? "flex-col" : "items-center"} gap-3 break-words px-1 py-2.5 md:min-w-52`}
      >
        <div className={`flex items-center justify-between gap-2`}>
          <Link href={`/users/${user.username}`}>
            <UserAvatar avatarUrl={user.avatarUrl} size={70} />
          </Link>
          {user.id !== loggedInUser.id && (
            <FollowButton userId={user.id} initialState={followerState} />
          )}
        </div>
        <Link href={`/users/${user.username}`}>
          <div className="text-lg font-semibold hover:underline">
            {user.displayName}
          </div>
          <div className="text-muted-foreground hover:underline">
            @{user.username}
          </div>
        </Link>
      </div>
      {user.bio && (
        <Linkify>
          <p className="line-clamp-4 whitespace-pre-line">{user.bio}</p>
        </Linkify>
      )}
      <FollowerCount userId={user.id} initialState={followerState} />
    </div>
  );

  return useDialog ? (
    <Popover>
      <PopoverTrigger asChild className="cursor-pointer">
        {children}
      </PopoverTrigger>
      <PopoverContent>
        <div className="flex flex-col gap-3">
          {content}
          <Link href={`/users/${user.username}`}>
            <Button
              variant="outline"
              className="flex w-full justify-center gap-3"
            >
              <UserCircle2 size={24} /> Afficher le profil
            </Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  ) : (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent>{content}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
