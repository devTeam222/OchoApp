import Link from "next/link";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import UserAvatar from "../UserAvatar";
import FollowButton from "../FollowButton";
import { ChannelData, FollowerInfo, UserData } from "@/lib/types";
import Linkify from "../Linkify";
import { useSession } from "@/app/(main)/SessionProvider";
import FollowerCount from "../FollowerCount";
import { Button } from "../ui/button";
import { CircleX, LogOut, ShieldBan, ShieldPlus, UserCircle2 } from "lucide-react";
import React from "react";
import AdminButton from "./AdminButton";

interface GroupUserPopover {
  user: UserData;
  type: "MEMBER" | "ADMIN" | "OWNER" | "OLD" | "BANNED";
  channel: ChannelData;
}

export default function GroupUserPopover({
  user,
  type,
  channel,
}: GroupUserPopover) {
  const { user: loggedInUser } = useSession();
  const isMember = (type !== "OLD" && type !== "BANNED");

  const followerState: FollowerInfo = {
    followers: user._count.followers,
    isFollowedByUser: !!user.followers.some(
      ({ followerId }) => followerId === loggedInUser.id,
    ),
  };

  const members = channel.members;

  //  get the loggedin user values in members
  const loggedMember = members.find(
    (member) => member.userId === loggedInUser.id,
  );

  return (
    <Popover>
      <PopoverTrigger asChild className="cursor-pointer">
        <li className="cursor-pointer px-4 py-2 active:bg-muted/30">
          <div className="flex items-center space-x-2">
            <UserAvatar avatarUrl={user?.avatarUrl} size={35} />
            <div className="flex-1 select-none">
              <p className="">
                {user.id === loggedInUser?.id ? "Vous" : user?.displayName}
              </p>
              <p className="text-sm text-muted-foreground">@{user?.username}</p>
            </div>
            {isMember && type !== "MEMBER" && (
              <span className="rounded bg-primary/30 p-[2px] text-xs">
                {type === "ADMIN"
                  ? "Admin du groupe"
                  : "Proprietaire du groupe"}
              </span>
            )}
          </div>
        </li>
      </PopoverTrigger>
      <PopoverContent>
        <div className="flex flex-col gap-3">
          <div>
            <div
              className={`flex max-w-80 items-center" gap-3 break-words px-1 py-2.5 md:min-w-52`}
            >
              <div className={`flex items-center justify-center gap-2`}>
                <Link href={`/users/${user.username}`}>
                  <UserAvatar avatarUrl={user.avatarUrl} size={70} />
                </Link>
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
          </div>
          <Link href={`/users/${user.username}`}>
            <Button
              variant="outline"
              className="flex w-full justify-center gap-3"
            >
              <UserCircle2 size={24} /> Afficher le profil
            </Button>
          </Link>
          {user.id !== loggedInUser.id && loggedMember?.type != "MEMBER" && isMember &&  (
            <>
              {(loggedMember?.type === "ADMIN" || loggedMember?.type === "OWNER") && type !== "OWNER" && (
                <>
                <AdminButton type={type} channel={channel} member={user.id}/>
              <Button
                variant="outline"
                className="flex w-full justify-center gap-3"
              >
                <LogOut size={24} /> Ejecter le membre
              </Button>
              <Button
                variant="destructive"
                className="flex w-full justify-center gap-3"
              >
                <CircleX size={24} /> Bannir le membre
              </Button>
                </>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
