import { validateRequest } from "@/auth";
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

    const bookmarksUser = await prisma.bookmark.findMany({
      where: {
        userId: user.id,
      },
      include: {
        post: {
          include: getPostDataIncludes(user.id)
        },
      },
      orderBy: { createdAt: "desc" },
      take: pageSize + 1,
      cursor: cursor ? { id: cursor } : undefined,
    });

    // Utilise Promise.all pour récupérer les posts avec leurs usernames
    const bookmarks = await Promise.all(
        bookmarksUser.map(async (bookmark) => {
          // Vérifie si les données nécessaires existent
          const username = bookmark.post?.user?.username || null;
      
          if (!bookmark.post || !username) {
            // Si le post ou le username est manquant, retourne le bookmark tel quel
            return bookmark;
          }
      
          // Si toutes les données sont présentes, effectue la requête supplémentaire
          const updatedPost = await prisma.bookmark.findUnique({
            where: { id: bookmark.id },
            include: {
              post: {
                include: getPostDataIncludes(user.id, username), // Inclut le username dans getPostDataIncludes
              },
            },
          });
      
          return updatedPost || bookmark; // Retourne les données enrichies ou le bookmark d'origine
        })
      );



    const nextCursor =
      bookmarks.length > pageSize ? bookmarks[pageSize].id : null;

    const data: PostsPage = {
      posts: bookmarks.slice(0, pageSize).map((bookmark) => bookmark.post),
      nextCursor,
    };

    return Response.json(data);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
