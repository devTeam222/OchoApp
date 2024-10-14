import { ChannelData, UserData } from "@/lib/types";
import { useSession } from "../SessionProvider";
import GroupAvatar from "@/components/GroupAvatar";
import UserAvatar from "@/components/UserAvatar";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
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
import { useActiveChannel } from "@/context/ActiveChatContext";
import LeaveGroupDialog from "@/components/messages/LeaveGroupDialog";

interface ChatHeaderProps {
  channel: ChannelData;
}

export default function ChatHeader({ channel }: ChatHeaderProps) {
  const [active, setActive] = useState(false);
  const [expandMembers, setExpandMembers] = useState(false);
  const { activeChannelId } = useActiveChannel();

  const { user: loggedUser } = useSession();

  useEffect(() => {
    setActive(false);
  }, [activeChannelId]);

  const otherUser =
    channel.members.length === 1 && channel.members[0].userId === loggedUser.id
      ? channel?.members.filter((member) => member.userId === loggedUser.id)[0]
          .user
      : channel?.members.filter((member) => member.userId !== loggedUser.id)[0]
          .user;

  const chatName = !!channel?.name?.trim()
    ? channel.name
    : (channel.id === `saved-${loggedUser.id}`
        ? loggedUser.displayName + " (vous)"
        : channel?.members.filter(
            (member) => member.userId !== loggedUser.id,
          )[0].user?.displayName) ||
      (channel.isGroup ? "Groupe de discussion" : "Utilisateur OchoApp");

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
          className="cursor-pointer sm:opacity-0 sm:pointer-events-none"
          onClick={() => setActive(false)}
        >
          <ArrowLeft size={35} />
        </div>
        <div
          className="cursor-pointer hover:text-red-500 max-sm:opacity-0 max-sm:pointer-events-none"
          onClick={() => setActive(false)}
        >
          <X size={35} />
        </div>
      </div>
      <div
        className={`flex w-full flex-1 flex-col transition-all ${active ? "absolute inset-0 h-fit min-h-full bg-card max-sm:bg-background sm:rounded-e-3xl" : "relative"}`}
      >
        {active && (
          <div className="pointer-events-none absolute inset-0 h-full w-full bg-primary/10 transition-none sm:hidden"></div>
        )}
        <div
          className={`group/head flex flex-1 items-center gap-2 ${active ? "cursor-default flex-col p-3" : "cursor-pointer"}`}
          onClick={() => !active && setActive(true)}
        >
          {channel.isGroup ? (
            <GroupAvatar
              size={size}
              className="transition-all *:transition-all"
            />
          ) : (
            <UserAvatar
              avatarUrl={otherUser?.avatarUrl}
              size={size}
              className="transition-all *:transition-all"
            />
          )}
          <div className="">
            <div className="text-xl font-bold">{chatName}</div>
            <div
              className={"text-muted-foreground " + (active ? "hidden" : "")}
            >
              {channel.isGroup ? (
                <div>
                  <span className="group-hover/head:hidden">{`${allMembers.length} membre${allMembers.length > 1 ? "s" : ""}`}</span>
                  <span className="hidden group-hover/head:inline">
                    {channel.members
                      .filter((member) => member.userId !== loggedUser.id)
                      .map((member) => member.user?.displayName.split(" ")[0])
                      .join(", ")}
                  </span>
                </div>
              ) : (
                `@${otherUser?.username}`
              )}
            </div>
          </div>
          {active && (
            <div className="text-muted-foreground">
              {channel.isGroup ? (
                <span className="">{`Groupe • ${allMembers.length} membre${allMembers.length > 1 ? "s" : ""}`}</span>
              ) : (
                `@${otherUser?.username}`
              )}
            </div>
          )}
          {active && (
            <div className="flex w-full flex-col items-center gap-3">
              <div className="flex w-full justify-center">
                {channel.isGroup ? (
                  <>
                    {loggedinMember?.type !== "OLD" && (
                      <AddMemberDialog channel={channel}>
                        <Button
                          variant="outline"
                          className="flex h-fit flex-col gap-2"
                        >
                          <UserRoundPlus size={35} />
                          <span>
                            Ajouter{" "}
                            <span className="max-sm:hidden">un membre</span>
                          </span>
                        </Button>
                      </AddMemberDialog>
                    )}
                  </>
                ) : (
                  <Link href={`/users/${otherUser?.username}`}>
                    <Button variant="outline" className="space-x-2">
                      <UserCircle2 /> afficher le profil
                    </Button>
                  </Link>
                )}
              </div>
              <div className="">
                <Linkify>
                  {channel.isGroup ? (
                    <span className="cursor-pointer text-primary hover:underline">
                      Ajouter une description
                    </span>
                  ) : (
                    <span>{!!otherUser?.bio && otherUser.bio}</span>
                  )}
                </Linkify>
              </div>
              <span className="text-muted-foreground">
                {channel.isGroup ? (
                  <span>
                    Créé{" "}
                    <Time time={channel.createdAt} relative={!isWeekAgo} long />
                  </span>
                ) : (
                  <span>
                    Membre depuis{" "}
                    {!!otherUser?.createdAt && (
                      <Time time={otherUser.createdAt} long />
                    )}
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
        {active && (
          <div className="flex w-full flex-1 flex-col gap-3">
            {channel.isGroup && loggedinMember?.type !== "BANNED" && (
              <ul className="flex w-full flex-col py-3">
                <li className="select-none px-4 text-xs font-bold text-muted-foreground">{`${allMembers.length} membres`}</li>
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
                        <p>Ajouter des membres</p>
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
                    className="cursor-pointer text-primary hover:underline"
                    onClick={() => setExpandMembers(true)}
                  >
                    Tout voir{" ("}
                    {lastPage.length}
                    {" de plus)"}
                  </li>
                )}

                {expandMembers && (
                  <li
                    className="cursor-pointer text-primary hover:underline"
                    onClick={() => setExpandMembers(false)}
                  >
                    Masquer
                  </li>
                )}
              </ul>
            )}
            {channel.isGroup && loggedinMember?.type !=="OLD" && loggedinMember?.type !=="BANNED" && (
              <ul className="flex w-full select-none flex-col py-3">
                <li className="cursor-pointer p-4 text-red-500 active:bg-muted/30">
                  <LeaveGroupDialog channel={channel}/>
                </li>
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
