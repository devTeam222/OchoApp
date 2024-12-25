import { validateRequest } from "@/auth";
import { calculateRelevanceScore } from "@/lib/postScore";
import prisma from "@/lib/prisma";
import { getPostDataIncludes, PostsPage } from "@/lib/types";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const cursor = req.nextUrl.searchParams.get("cursor") || undefined;

    const pageSize = 10;

    const { user } = await validateRequest();

    if (!user) {
      return Response.json({ error: "Action non autorisée" }, { status: 401 });
    }

    const postsUser = await prisma.post.findMany({
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

    // Utilise Promise.all pour récupérer les posts avec leurs usernames
    const posts = await Promise.all(
      postsUser.map(async (post) => {
        // Vérifie si les données nécessaires existent
        const username = post?.user?.username || null;

        if (!post || !username) {
          // Si le post ou le username est manquant, retourne le post tel quel
          return post;
        }

        // Si toutes les données sont présentes, effectue la requête supplémentaire
        const updatedPost = await prisma.post.findUnique({
          where: { id: post.id },
          include: getPostDataIncludes(user.id, username),
        });

        return updatedPost || post; // Retourne les données enrichies ou le post d'origine
      }),
    );

    const postsWithScores = await Promise.all(
      posts.slice(0, pageSize).map(async (post) => ({
        ...post,
        relevanceScore: await calculateRelevanceScore(post, user, posts[0]?.id || undefined),
      })),
    );

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
