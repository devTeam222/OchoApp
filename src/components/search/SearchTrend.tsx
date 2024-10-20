import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getUserDataSelect } from "@/lib/types";
import Link from "next/link";
import { Suspense } from "react";
import UserTooltip from "../UserTooltip";
import UserAvatar from "../UserAvatar";
import FollowButton from "../FollowButton";
import { unstable_cache } from "next/cache";
import FormattedInt from "../FormattedInt";
import PostsLoadingSkeleton from "../posts/PostsLoadingSkeleton";
import { cn } from "@/lib/utils";

export default function SearchTrend() {
  return (
    <div className="sticky top-0 h-fit w-full flex-none space-y-3 rounded-2xl pb-3 sm:hidden">
      <Suspense fallback={<PostsLoadingSkeleton />}>
        <TrendingTopics />
        <WhoToFollow />
      </Suspense>
    </div>
  );
}

async function WhoToFollow() {
  const { user } = await validateRequest();
  if (!user) return null;

  const loggedInUserData = await prisma.user.findFirst({
    where: {
      id: {
        equals: user.id,
        mode: "insensitive",
      },
    },
    select: getUserDataSelect(user.id),
  });

  if (!loggedInUserData) return null;

  const usersToFollow = await prisma.user.findMany({
    where: {
      NOT: {
        id: user.id,
      },
      followers: {
        none: {
          followerId: user.id,
        },
      },
    },
    select: getUserDataSelect(user.id),
    take: 5,
  });

  return (
    <div className="space-y-5 rounded-2xl bg-card p-5 shadow-sm">
      <h2 className="text-xl font-bold">Suggestions pour vous</h2>
      {usersToFollow.map((user) => {
        const now = Date.now();

        const lastSeenDate = new Date(user.lastSeen).getTime() - 60 * 1000;

        const isUserOnline = lastSeenDate > now;
        return (
          <div
            key={user.id}
            className="flex items-center justify-between gap-3"
          >
            <UserTooltip user={user}>
              <Link
                href={`/users/${user.username}`}
                className="flex items-center gap-3"
              >
                <UserAvatar
                  avatarUrl={user.avatarUrl}
                  className="flex-none"
                  online={isUserOnline}
                />
                <div>
                  <h3 className="line-clamp-1 break-all font-semibold hover:underline">
                    {user.displayName}
                  </h3>
                  <p className="line-clamp-1 break-all text-muted-foreground">
                    @{user.username}
                  </p>
                </div>
              </Link>
            </UserTooltip>
            <FollowButton
              userId={user.id}
              initialState={{
                followers: user._count.followers,
                isFollowedByUser: user.followers.some(
                  ({ followerId }) => followerId === user.id,
                ),
                isFolowing: loggedInUserData.followers.some(
                  ({ followerId }) => followerId === user.id,
                ),
                isFriend:
                  user.followers.some(
                    ({ followerId }) => followerId === loggedInUserData.id,
                  ) &&
                  loggedInUserData.followers.some(
                    ({ followerId }) => followerId === user.id,
                  ),
              }}
            />
          </div>
        );
      })}
      {!usersToFollow.length && (
        <p className="w-full px-2 py-8 text-center italic text-muted-foreground">
          Aucune suggestion pour le moment
        </p>
      )}
    </div>
  );
}

const getTrendingTopics = unstable_cache(
  async () => {
    const result = await prisma.$queryRaw<{ hashtag: string; count: bigint }[]>`
        SELECT LOWER(unnest(regexp_matches(content, '#[[:alnum:]_]+', 'g'))) AS hashtag, COUNT(*) as count 
        FROM posts
        GROUP BY hashtag
        ORDER BY count DESC, hashtag ASC
        LIMIT 5
        `;
    return result.map((row) => ({
      hashtag: row.hashtag,
      count: Number(row.count),
    }));
  },
  ["trending_topics"],
  {
    revalidate: 3 * 3600,
  },
);

async function TrendingTopics() {
  const trendingTopics = await getTrendingTopics();

  return (
    <div
      className={cn(
        "space-y-5 rounded-2xl bg-card p-5 shadow-sm",
        !trendingTopics.length && "hidden",
      )}
    >
      <h2 className="text-xl font-bold">Tendances</h2>
      {!trendingTopics.length && (
        <p className="w-full px-2 py-8 text-center italic text-muted-foreground">
          Aucune tendance pour le moment
        </p>
      )}
      {trendingTopics.map(({ hashtag, count }) => {
        const title = hashtag.split("#")[1];

        return (
          <Link key={title} href={`/hashtag/${title}`} className="block">
            <h3
              className="line-clamp-1 break-all font-semibold hover:underline"
              title={hashtag}
            >
              {hashtag}
            </h3>
            <p className="break-all text-sm text-muted-foreground">
              <FormattedInt number={count} /> Post{count === 1 ? "" : "s"}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
