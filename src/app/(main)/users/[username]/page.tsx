import { validateRequest } from "@/auth";
import FollowButton from "@/components/FollowButton";
import FollowerCount from "@/components/FollowerCount";
import FormattedInt from "@/components/FormattedInt";
import Time from "@/components/Time";
import TrendsSidebar from "@/components/TrendsSidebar";
import UserAvatar from "@/components/UserAvatar";
import prisma from "@/lib/prisma";
import { FollowerInfo, getUserDataSelect, UserData } from "@/lib/types";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import UserPosts from "./UserPosts";
import Linkify from "@/components/Linkify";
import EditProfileButton from "./EditProfileButton";
import { Frown } from "lucide-react";
import SetNavigation from "@/components/SetNavigation";

interface PageProps {
  params: { username: string };
}

const getUser = cache(async (username: string, loggedInUserId: string) => {
  const user = await prisma.user.findFirst({
    where: {
      username: {
        equals: username,
        mode: "insensitive",
      },
    },
    select: getUserDataSelect(loggedInUserId),
  });

  if (!user) notFound();

  return user;
});

const getLoggedUser = cache(async (userId: string, loggedInUserId: string) => {
  const user = await prisma.user.findFirst({
    where: {
      id: {
        equals: loggedInUserId,
        mode: "insensitive",
      },
    },
    select: getUserDataSelect(userId),
  });

  if (!user) notFound();

  return user;
});

export async function generateMetadata({
  params: { username },
}: PageProps): Promise<Metadata> {
  const { user: loggedInUser } = await validateRequest();

  if (!loggedInUser) return {};
  const user = await getUser(username, loggedInUser.id);
  return {
    title: `${user.displayName}`,
  };
}

export default async function page({ params: { username } }: PageProps) {
  const { user: loggedInUser } = await validateRequest();

  if (!loggedInUser)
    return (
      <div className="my-8 flex w-full select-none flex-col items-center gap-2 text-center text-muted-foreground">
      <Frown size={150} />
      <h2 className="text-xl">Quelque chose s&apos;est mal passé.</h2>
    </div>
    );

  const user = await getUser(username, loggedInUser.id);
  const loggedUserData = await getLoggedUser(user.id, loggedInUser.id);

  return (
    <main className="flex w-full min-w-0 gap-5 max-sm:pb-4 relative">
      <SetNavigation navPage={null}/>
      <div className="w-full min-w-0 space-y-2 sm:space-y-5 pb-2">
        <UserProfile
          user={user}
          loggedInUserId={loggedInUser.id}
          loggedInUser={loggedUserData}
        />
        <div className="sm:rounded-2xl bg-card/50 sm:bg-card p-5 shadow-sm">
          <h2 className="text-center text-2xl font-bold">Publications</h2>
        </div>
        <UserPosts userId={user.id} />
      </div>
      <TrendsSidebar />
    </main>
  );
}

interface UserProfileProps {
  user: UserData;
  loggedInUserId: string;
  loggedInUser: UserData;
}

async function UserProfile({
  user,
  loggedInUserId,
  loggedInUser,
}: UserProfileProps) {
  const followerInfo: FollowerInfo = {
    followers: user._count.followers,
    isFollowedByUser: user.followers.some(
      ({ followerId }) => followerId === loggedInUserId,
    ),
    isFolowing: loggedInUser.followers.some(
      ({ followerId }) => followerId === user.id,
    ),
    isFriend:
      user.followers.some(({ followerId }) => followerId === loggedInUserId) &&
      loggedInUser.followers.some(({ followerId }) => followerId === user.id),
  };

  return (
    <div className="flex h-fit w-full flex-col items-center gap-5 sm:rounded-2xl bg-card/50 sm:bg-card p-5 shadow-sm">
      <UserAvatar
        avatarUrl={user.avatarUrl}
        size={250}
        className="mx-auto size-full max-h-60 max-w-60 rounded-full"
      />
      <div className="flex w-full flex-wrap gap-3 sm:flex-nowrap">
        <div className="me-auto space-y-3">
          <div>
            <h1 className="text-3xl font-bold">{user.displayName}</h1>
            <div className="text-muted-foreground">@{user.username}</div>
          </div>
          <div>
            Membre depuis <Time time={user.createdAt} long />
          </div>
          <div className="flex items-center gap-3">
            <span>
              <span className="font-semibold">
                <FormattedInt number={user._count.posts} />
              </span>{" "}
              Posts
            </span>

            <FollowerCount userId={user.id} initialState={followerInfo} />
          </div>
        </div>
        {user.id === loggedInUserId ? (
          <EditProfileButton user={user} />
        ) : (
          <FollowButton userId={user.id} initialState={followerInfo} />
        )}
      </div>
      {user.bio && (
        <>
          <hr />
          <Linkify>
            <p className="overflow-hidden whitespace-pre-line break-words">
              {user.bio}
            </p>
          </Linkify>
        </>
      )}
    </div>
  );
}
