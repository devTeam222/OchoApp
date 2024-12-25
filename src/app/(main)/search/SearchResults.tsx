"use client";

import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";
import Post from "@/components/posts/Post";
import PostsLoadingSkeleton from "@/components/posts/PostsLoadingSkeleton";
import { t } from "@/context/LanguageContext";
import kyInstance from "@/lib/ky";
import { PostsPage } from "@/lib/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Frown, Loader2, SearchX } from "lucide-react";

interface SearchResultsProps {
  query: string;
}

export default function SearchResults({ query }: SearchResultsProps) {
  const { noSearchResultFor, tryNewSearch, dataError, } = t();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["post-feed", "search", query],
    queryFn: ({ pageParam }) =>
      kyInstance
        .get("/api/search", {
          searchParams: {
            q: query,
            ...(pageParam ? { cursor: pageParam } : {}),
          },
        })
        .json<PostsPage>(),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    gcTime: 0,
  });

  const posts = data?.pages.flatMap((page) => page.posts) || [];

  if (status === "pending") {
    return <PostsLoadingSkeleton />;
  }

  if (status === "success" && !posts.length && !hasNextPage) {
    return (
      <div className="my-8 flex w-full flex-col items-center gap-2 text-center text-muted-foreground">
        <SearchX size={150} />
        <h2 className="text-xl">{noSearchResultFor.replace("[q]", query)}</h2>
        <h2 className="text-xl">{tryNewSearch}</h2>
      </div>
    );
  }
  if (status === "error") {
    <div className="my-8 flex w-full flex-col items-center gap-2 text-center text-muted-foreground">
      <Frown size={150} />
      <h2 className="text-xl">{dataError}</h2>
    </div>;
  }

  return (
    <InfiniteScrollContainer
      className="space-y-2 sm:space-y-5 pb-5"
      onBottomReached={() => hasNextPage && !isFetching && fetchNextPage()}
    >
      {posts.map((post) => (
        <Post key={post.id} post={post} />
      ))}
      {isFetchingNextPage && <Loader2 className="mx-auto my-3 animate-spin" />}
    </InfiniteScrollContainer>
  );
}
