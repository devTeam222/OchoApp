import Link from "next/link";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import UserAvatar from "../UserAvatar";
import { ChannelData, FollowerInfo, UserData } from "@/lib/types";
import Linkify from "../Linkify";
import { useSession } from "@/app/(main)/SessionProvider";

import { PlusCircle, UserCircle2 } from "lucide-react";
import React, { PropsWithChildren } from "react";
import AdminButton from "./AdminButton";
import { MemberType } from "@prisma/client";
import RemoveMemberDialog from "./RemoveMemberDialog";
import BanDialog from "./BanDialog";
import RestoreMemberButton from "./RestoreMemberButton";
import Time from "../Time";
import MessageButton from "./MessageButton";
import { Button } from "../ui/button";

interface GroupUserPopover extends PropsWithChildren {
  user: UserData;
  type: MemberType;
  channel: ChannelData;
}

export default function GroupUserPopover({
  user,
  type,
  channel,
  children,
}: GroupUserPopover) {
  const { user: loggedInUser } = useSession();
  const isMember = type !== "OLD" && type !== "BANNED";
  const member = channel.members.find((member) => member.userId === user.id);

  const joinedAt: Date | null = member?.joinedAt ?? null;
  const leftAt: Date | null = member?.leftAt ?? null;

  const members = channel.members;

  //  get the loggedin user values in members
  const loggedMember = members.find(
    (member) => member.userId === loggedInUser.id,
  );
  const isLoggedAdmin =
    loggedMember?.type === "ADMIN" || loggedMember?.type === "OWNER";
  const isBanned = type === "BANNED";
  const isOld = type === "OLD";

  return (
    <Popover>
      <PopoverTrigger asChild className="cursor-pointer">
        {children ?? (
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
        )}
      </PopoverTrigger>
      <PopoverContent>
        <div className="flex flex-col gap-3">
          <div className="divide-y-2">
            <div
              className={`flex max-w-80 items-center gap-3 break-words px-1 py-2.5 md:min-w-52`}
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
                <p className="line-clamp-4 whitespace-pre-line px-2">{user.bio}</p>
              </Linkify>
            )}
            {joinedAt && (
              <p className="px-3 text-sm font-semibold text-muted-foreground">
                Membre depuis <Time time={joinedAt} long />
              </p>
            )}
            {joinedAt && leftAt && leftAt > joinedAt && (
              <p className="px-3 text-sm font-semibold text-muted-foreground">
                Est parti depuis <Time time={leftAt} long />
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Link href={`/users/${user.username}`}>
              <Button variant="secondary" className="w-full">
                <UserCircle2 /> Profil
              </Button>
            </Link>
            <MessageButton userId={user.id}/>
          </div>
          {user.id !== loggedInUser.id &&
            loggedMember?.type != "MEMBER" &&
            isMember && (
              <>
                {isLoggedAdmin && type !== "OWNER" && (
                  <>
                    <AdminButton
                      type={type}
                      channel={channel}
                      member={user.id}
                    />
                    <RemoveMemberDialog memberId={user.id} channel={channel} />
                    <BanDialog memberId={user.id} channel={channel} />
                  </>
                )}
              </>
            )}
          {!isMember && isLoggedAdmin && (
            <>
              {isBanned && (
                <RestoreMemberButton memberId={user.id} channel={channel}>
                  <PlusCircle size={24} /> Retirer la suspention
                </RestoreMemberButton>
              )}
              {isOld && (
                <RestoreMemberButton memberId={user.id} channel={channel}>
                  <PlusCircle size={24} /> Reintegrer
                </RestoreMemberButton>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
