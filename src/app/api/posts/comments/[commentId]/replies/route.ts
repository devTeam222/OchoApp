import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { RepliesPage, getCommentDataIncludes } from "@/lib/types";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params: { commentId } }: { params: { commentId: string } },
) {
  try {
    const cursor = req.nextUrl.searchParams.get("cursor") || undefined;
    const comment = req.nextUrl.searchParams.get("comment") || null;

    const pageSize = 3;
    const firstLevelCommentId = commentId;

    const { user } = await validateRequest();

    if (!user) {
      return Response.json({ error: "Action non autorisée" }, { status: 401 });
    }

    // Étape 1 : Récupérer le commentaire cible si un commentId est fourni
    let targetComment = null;
    // if (comment) {
    //   targetComment = await prisma.comment.findUnique({
    //     where: { id: comment, type: { not: "COMMENT" } },
    //     include: getCommentDataIncludes(user.id),
    //   });
    // }

    const comments = await prisma.comment.findMany({
      where: {
        firstLevelCommentId,
        id: { not: comment || undefined },
        type: { not: "COMMENT" },
      },
      include: getCommentDataIncludes(user.id),
      orderBy: { createdAt: "desc" },
      take: -pageSize - 1,
      cursor: cursor ? { id: cursor } : undefined,
    });

    const previousCursor = comments.length > pageSize ? comments[0].id : null;

    const data: RepliesPage = {
      replies: targetComment
        ? [targetComment, ...comments.slice(0, pageSize)]
        : comments.slice(0, pageSize),
      previousCursor,
    };

    return Response.json(data);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
