import { validateRequest } from "@/auth";
import { calculateAndStoreScoresForUser, calculateRelevanceScore } from "@/lib/postScore";
import prisma from "@/lib/prisma";
import { getPostDataIncludes, PostsPage } from "@/lib/types";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const cursor = req.nextUrl.searchParams.get("cursor") || undefined;

    const pageSize = 5;

    const { user } = await validateRequest();

    if (!user) {
      return Response.json({ error: "Action non autorisée" }, { status: 401 });
    }

    const posts = await prisma.post.findMany({
      where: {
        user: {
          followers: {
            some: {
              followerId: user.id,
            },
          },
        },
      },
      include: getPostDataIncludes(user.id),
      orderBy: { createdAt: "desc" },
      take: pageSize + 1,
      cursor: cursor ? { id: cursor } : undefined,
    });

    const postsWithScores = posts.slice(0, pageSize).map((post) => {
      return {
        ...post,
        relevanceScore: calculateRelevanceScore(
          post,
          user,
          posts[0]?.id || undefined,
        ),
      };
    });

    const sortedPosts = postsWithScores
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .map(({ relevanceScore, ...post }) => post);

    const nextCursor = posts.length > pageSize ? posts[pageSize].id : null;

    const data: PostsPage = {
      posts: sortedPosts,
      nextCursor,
    };

    return Response.json(data);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
