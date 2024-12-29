import { ChannelData, UserData } from "@/lib/types";
import { useSession } from "../SessionProvider";
import GroupAvatar from "@/components/GroupAvatar";
import UserAvatar from "@/components/UserAvatar";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Settings2,
  UserCircle2,
  UserRoundPlus,
  X,
} from "lucide-react";
import Linkify from "@/components/Linkify";
import { Button } from "@/components/ui/button";
import Time from "@/components/Time";
import Link from "next/link";
import AddMemberDialog from "@/components/messages/AddMemberDialog";
import GroupUserPopover from "@/components/messages/GroupUserPopover";
import { useActiveChannel } from "@/context/ChatContext";
import LeaveGroupDialog from "@/components/messages/LeaveGroupDialog";
import GroupChatSettingsDialog from "@/components/messages/GroupChatSettingsDialog";
import { cn } from "@/lib/utils";
import { t } from "@/context/LanguageContext";
import Verified from "@/components/Verified";
import { VerifiedType } from "@prisma/client";

interface ChatHeaderProps {
  channel: ChannelData;
  onDelete: () => void;
}

export default function ChatHeader({ channel, onDelete }: ChatHeaderProps) {
  const [active, setActive] = useState(false);
  const [expandMembers, setExpandMembers] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogFocus, setDialogFocus] = useState<"name" | "description" | null>(
    null,
  );
  const { activeChannelId } = useActiveChannel();
  const {
    group,
    groupChat,
    appUser,
    you,
    online,
    activeText,
    viewProfile,
    created,
    member,
    members: membersText,
    namesAndName,
    namesAndOthers,
    settings,
    addAMember,
    addMembers,
    addDescription,
    noDescription,
    joined,
    seeAllMore,
    hide,
    memberSince,
    thisAccountDeleted,
  } = t();

  const aMember = addAMember.match(/-(.*?)-/)?.[1] || "a member";
  const addAM = addAMember.replace(/-.*?-/, "");
  const { user: loggedUser } = useSession();

  useEffect(() => {
    setActive(false);
  }, [activeChannelId]);

  const isSaved = channel.id === `saved-${loggedUser.id}`;

  const otherUser =
    channel.members.length === 1 && isSaved
      ? channel?.members.filter((member) => member.userId === loggedUser.id)[0]
          .user
      : channel?.members.filter((member) => member.userId !== loggedUser.id)[0]
          .user;

  const expiresAt = isSaved
    ? otherUser?.verified?.[0]?.expiresAt
    : otherUser?.verified?.[0]?.expiresAt;
  const canExpire = !!(expiresAt ? new Date(expiresAt).getTime() : null);

  const expired = canExpire && expiresAt ? new Date() < expiresAt : false;

  const isVerified =
    (isSaved ? !!otherUser?.verified[0] : !!otherUser?.verified[0]) &&
    !expired &&
    !channel.isGroup;
  const verifiedType: VerifiedType | undefined = isVerified
    ? otherUser?.verified[0].type || "STANDARD"
    : undefined;

  const verifiedCheck = isVerified ? (
    <Verified type={verifiedType} prompt={active} />
  ) : null;

  const chatName = !!channel?.name?.trim()
    ? channel.name
    : (isSaved
        ? loggedUser.displayName + ` (${you})`
        : channel?.members.filter(
            (member) => member.userId !== loggedUser.id,
          )[0].user?.displayName) || (channel.isGroup ? groupChat : appUser);

  const weekAgo = new Date(
    channel.createdAt.getTime() - 6 * 24 * 60 * 60 * 1000,
  );
  const isWeekAgo = weekAgo.getTime() >= new Date().getTime();

  const size = active ? 120 : 40;

  // Get loggedinMember from members
  const loggedinMember = channel.members.find(
    (member) => member.userId === loggedUser.id,
  );
  // Get admins
  const admins = channel.members.filter(
    (member) =>
      member.type === "ADMIN" && member.userId !== loggedinMember?.userId,
  );
  // Get owner
  const owner = [
    channel.members.find((member) => member.type === "OWNER"),
  ].filter((member) => member?.userId !== loggedinMember?.userId);
  // Get members
  const members = channel.members.filter((member) => member.type !== "ADMIN");

  // Remove logged user from owner admins and members
  const filteredMembers = members.filter(
    (member) => member.userId !== loggedUser.id,
  );

  // Remove admins and owner from filteredMembers
  const filteredMembers2 = filteredMembers.filter(
    (member) => member.type !== "ADMIN",
  );

  const filteredMembers3 = filteredMembers2.filter(
    (member) => member.type !== "OWNER",
  );

  const mergedMembers = [
    loggedinMember,
    ...owner,
    ...admins,
    ...filteredMembers3,
  ];
  const allMembers = mergedMembers
    .filter((member) => member?.type !== "OLD")
    .filter((member) => member?.type !== "BANNED");

  const oldMembers = mergedMembers.filter((member) => member?.type === "OLD");
  const bannedMembers = mergedMembers.filter(
    (member) => member?.type === "BANNED",
  );

  const firstPage = allMembers.slice(0, 10);
  const lastPage = allMembers.slice(10, allMembers.length);

  const now = Date.now();

  const isUserOnline =
    !active &&
    (channel.id === `saved-${loggedUser.id}` ||
      (!!otherUser?.lastSeen &&
        new Date(otherUser.lastSeen).getTime() - 40_000 > now));

  const lastSeenTimeStamp = otherUser?.lastSeen
    ? new Date(new Date(otherUser.lastSeen).getTime() - 30_000).getTime()
    : null;

  return (
    <div
      className={`${active ? "absolute inset-0 z-10 h-full w-full overflow-y-auto bg-card max-sm:bg-background sm:rounded-e-3xl" : "relative flex-1"}`}
    >
      <div
        className={
          "sticky inset-0 z-10 flex justify-between p-4 " +
          (!active ? "hidden" : "")
        }
      >
        <div
          className="cursor-pointer sm:pointer-events-none sm:opacity-0"
          onClick={() => setActive(false)}
        >
          <ArrowLeft size={35} />
        </div>
        <div
          className="cursor-pointer hover:text-red-500 max-sm:pointer-events-none max-sm:opacity-0"
          onClick={() => setActive(false)}
        >
          <X size={35} />
        </div>
      </div>
      <div
        className={`flex w-full flex-1 flex-col transition-all ${active ? "absolute inset-0 h-fit min-h-full bg-card max-sm:bg-background sm:rounded-e-3xl" : "relative"}`}
      >
        <div
          className={`group/head flex flex-1 items-center gap-2 transition-all ${active ? "cursor-default flex-col p-3" : "cursor-pointer"}`}
          onClick={() => !active && setActive(true)}
        >
          {channel.isGroup ? (
            <GroupAvatar
              size={size}
              className="transition-all *:transition-all"
              avatarUrl={channel.groupAvatarUrl}
            />
          ) : (
            <UserAvatar
              avatarUrl={otherUser?.avatarUrl}
              size={size}
              className="transition-all *:transition-all"
              online={isUserOnline}
            />
          )}
          <div className="">
            {channel.isGroup &&
            active &&
            (loggedinMember?.type === "ADMIN" ||
              loggedinMember?.type === "OWNER") ? (
              <div
                className={cn(
                  "cursor-pointer text-ellipsis text-xl font-bold sm:hover:text-primary sm:hover:underline",
                  isVerified &&
                    "flex items-center gap-1",
                )}
                title="Modifier le nom du groupe"
                onClick={() => {
                  setDialogFocus("name");
                  setShowDialog(true);
                }}
              >
                <span className="flex-1">{chatName}</span>
                {verifiedCheck}
              </div>
            ) : (
              <div
                className={cn(
                  "text-xl font-bold",
                  isVerified &&
                    "flex items-center gap-1 *:line-clamp-1 *:text-ellipsis w-full",
                )}
              >
                <span className="flex-1">{chatName}</span>

                {verifiedCheck}
              </div>
            )}
            <div
              className={"text-muted-foreground " + (active ? "hidden" : "")}
            >
              {channel.isGroup ? (
                <div>
                  <span className="max-sm:hidden sm:group-hover/head:hidden">{`${allMembers.length} ${allMembers.length > 1 ? membersText.toLowerCase() : member.toLowerCase()}`}</span>
                  <span className="text-ellipsis max-sm:line-clamp-1 sm:hidden sm:group-hover/head:inline">
                    {channel.members.length === 1
                      ? channel.members[0].user?.displayName.split(" ")[0]
                      : channel.members.length > 2
                        ? channel.members.length > 6
                          ? namesAndOthers
                              .replace(
                                "[names]",
                                channel.members
                                  .filter(
                                    (member) => member.userId !== loggedUser.id,
                                  )
                                  .slice(0, 5)
                                  .map(
                                    (member) =>
                                      member.user?.displayName.split(" ")[0],
                                  )
                                  .join(", "),
                              )
                              .replace("[len]", `${channel.members.length - 6}`)
                          : namesAndName
                              .replace(
                                "[names]",
                                channel.members
                                  .filter(
                                    (member) => member.userId !== loggedUser.id,
                                  )
                                  .slice(0, channel.members.length - 2)
                                  .map(
                                    (member) =>
                                      member.user?.displayName.split(" ")[0],
                                  )
                                  .join(", "),
                              )
                              .replace(
                                "[name]",
                                channel.members[
                                  channel.members.length - 1
                                ].user?.displayName.split(" ")[0] || appUser,
                              )
                        : channel.members[
                            channel.members.length - 1
                          ].user?.displayName.split(" ")[0] || appUser}
                  </span>
                </div>
              ) : (
                <span className="">
                  {isUserOnline || otherUser?.id === loggedUser.id ? (
                    online
                  ) : lastSeenTimeStamp && lastSeenTimeStamp < now ? (
                    <>
                      {activeText}{" "}
                      <Time
                        time={new Date(lastSeenTimeStamp + 10_000)}
                        relative
                        long={false}
                      />
                    </>
                  ) : (
                    `@${otherUser?.username || "ochoapp-user"}`
                  )}
                </span>
              )}
            </div>
          </div>
          {active && (
            <div className="text-muted-foreground">
              {channel.isGroup ? (
                <span className="">{`${group} • ${allMembers.length} ${allMembers.length > 1 ? membersText.toLowerCase() : member}`}</span>
              ) : (
                <span>
                  <div>@{otherUser?.username || "ochoapp-user"}</div>
                  <div className="text-center">
                    {isUserOnline || otherUser?.id === loggedUser.id
                      ? online
                      : lastSeenTimeStamp &&
                        lastSeenTimeStamp < now && (
                          <>
                            {activeText}{" "}
                            <Time
                              time={new Date(lastSeenTimeStamp + 10_000)}
                              relative
                              long={false}
                            />
                          </>
                        )}
                  </div>
                </span>
              )}
            </div>
          )}
          {active && (
            <div className="flex w-full flex-col items-center gap-3">
              <div className="flex w-full justify-center">
                {channel.isGroup ? (
                  <div className="flex w-full justify-center gap-2">
                    {loggedinMember?.type !== "OLD" && (
                      <AddMemberDialog
                        channel={channel}
                        className="max-w-44 flex-1"
                      >
                        <Button
                          variant="outline"
                          className="flex h-fit w-full flex-col gap-2"
                        >
                          <UserRoundPlus size={35} />
                          <span>
                            {addAM}{" "}
                            <span className="max-sm:hidden">{aMember}</span>
                          </span>
                        </Button>
                      </AddMemberDialog>
                    )}
                    {(loggedinMember?.type === "ADMIN" ||
                      loggedinMember?.type === "OWNER") && (
                      <GroupChatSettingsDialog
                        channel={channel}
                        open={showDialog}
                        onOpenChange={(open) => {
                          setShowDialog(open);
                          open === false && setDialogFocus(null);
                        }}
                        className="max-w-44 flex-1"
                        focus={dialogFocus}
                      >
                        <Button
                          variant="outline"
                          className="flex h-fit w-full flex-col gap-2"
                        >
                          <Settings2 size={35} />
                          <span>{settings}</span>
                        </Button>
                      </GroupChatSettingsDialog>
                    )}
                  </div>
                ) : (
                  <Link href={`/users/${otherUser?.username || "-"}`}>
                    <Button variant="outline" className="flex gap-1">
                      <UserCircle2 /> {viewProfile}
                    </Button>
                  </Link>
                )}
              </div>
              <hr className="w-full" />
              <div>
                <Linkify>
                  {channel.isGroup ? (
                    <>
                      {channel.description ? (
                        <p>{channel.description}</p>
                      ) : loggedinMember?.type === "ADMIN" ||
                        loggedinMember?.type === "OWNER" ? (
                        <Button
                          variant="link"
                          className="py-0"
                          title={addDescription}
                          onClick={() => {
                            setDialogFocus("description");
                            setShowDialog(true);
                          }}
                        >
                          {addDescription}
                        </Button>
                      ) : (
                        <span className="text-muted-foreground">
                          {noDescription}
                        </span>
                      )}
                    </>
                  ) : (
                    !!otherUser?.bio && <p>{otherUser.bio}</p>
                  )}
                </Linkify>
              </div>
              {(!!otherUser?.bio?.trim() || channel.isGroup) && (
                <hr className="w-full" />
              )}
              <span className="text-muted-foreground">
                {channel.isGroup ? (
                  <span>
                    {created}{" "}
                    <Time time={channel.createdAt} relative={!isWeekAgo} long />
                  </span>
                ) : (
                  <span>
                    {otherUser?.id ? (
                      <>
                        {channel.isGroup ? joined : memberSince}{" "}
                        {!!otherUser?.createdAt && (
                          <Time time={otherUser.createdAt} long />
                        )}
                      </>
                    ) : (
                      thisAccountDeleted
                    )}
                  </span>
                )}
              </span>
              {channel.isGroup && <hr className="w-full" />}
            </div>
          )}
        </div>
        {active && (
          <div className="flex w-full flex-1 flex-col gap-3">
            {channel.isGroup && loggedinMember?.type !== "BANNED" && (
              <ul className="flex w-full flex-col py-3">
                <li className="select-none px-4 text-xs font-bold text-muted-foreground">{`${allMembers.length} ${membersText.toLowerCase()}`}</li>
                {loggedinMember?.type !== "OLD" && (
                  <AddMemberDialog channel={channel}>
                    <li className="cursor-pointer p-4 active:bg-muted/30">
                      <div className="flex items-center space-x-2">
                        <div
                          className={`relative flex aspect-square h-fit min-h-[35px] w-fit min-w-fit items-center justify-center overflow-hidden rounded-full bg-primary`}
                        >
                          <UserRoundPlus
                            className="absolute flex items-center justify-center text-primary-foreground"
                            size={35 - 16}
                          />
                        </div>
                        <p>{addMembers}</p>
                      </div>
                    </li>
                  </AddMemberDialog>
                )}

                {firstPage.map((member, key) => {
                  if (!member?.user) return null;
                  const user: UserData = member.user;
                  return (
                    <GroupUserPopover
                      key={key}
                      user={user}
                      type={member.type}
                      channel={channel}
                    />
                  );
                })}

                <>
                  {!!lastPage.length &&
                    expandMembers &&
                    lastPage.map((member, key) => {
                      if (!member?.user) return null;
                      const user: UserData = member.user;
                      return (
                        <GroupUserPopover
                          key={key}
                          user={user}
                          type={member.type}
                          channel={channel}
                        />
                      );
                    })}
                  {loggedinMember?.type !== "OLD" && !!oldMembers.length && (
                    <>
                      <li className="select-none px-4 text-xs font-bold text-muted-foreground">{`Anciens membres (${oldMembers.length})`}</li>
                      {oldMembers.map((member, key) => {
                        if (!member?.user) return null;
                        const user: UserData = member.user;
                        return (
                          <GroupUserPopover
                            key={key}
                            user={user}
                            type={member.type}
                            channel={channel}
                          />
                        );
                      })}
                    </>
                  )}
                  {(loggedinMember?.type === "ADMIN" ||
                    loggedinMember?.type === "OWNER") &&
                    !!bannedMembers.length && (
                      <>
                        <li className="select-none px-4 text-xs font-bold text-destructive">{`Membres suspendus (${bannedMembers.length})`}</li>
                        {bannedMembers.map((member, key) => {
                          if (!member?.user) return null;
                          const user: UserData = member.user;
                          return (
                            <GroupUserPopover
                              key={key}
                              user={user}
                              type={member.type}
                              channel={channel}
                            />
                          );
                        })}
                      </>
                    )}
                </>

                {!!lastPage.length && !expandMembers && (
                  <li
                    className="flex cursor-pointer px-4 py-2 text-primary hover:underline max-sm:justify-center"
                    onClick={() => setExpandMembers(true)}
                  >
                    {seeAllMore.replace("[len]", `${lastPage.length}`)}
                  </li>
                )}

                {expandMembers && (
                  <li
                    className="flex cursor-pointer px-4 py-2 text-primary hover:underline max-sm:justify-center"
                    onClick={() => setExpandMembers(false)}
                  >
                    {hide}
                  </li>
                )}
              </ul>
            )}
            {channel.isGroup &&
              loggedinMember?.type !== "OLD" &&
              loggedinMember?.type !== "BANNED" && (
                <ul className="flex w-full select-none flex-col py-3">
                  <li className="cursor-pointer p-4 text-red-500 active:bg-muted/30">
                    <LeaveGroupDialog channel={channel} onDelete={onDelete} />
                  </li>
                </ul>
              )}
          </div>
        )}
      </div>
    </div>
  );
}
