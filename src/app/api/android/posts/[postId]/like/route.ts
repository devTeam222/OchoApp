// /api/android/posts/[postId]/like/route.ts
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { ApiResponse } from "../../../utils/dTypes";

export async function POST(
  req: NextRequest,
  { params: { postId } }: { params: { postId: string } },
) {
  try {
    const headersList = headers();
    const authorization = headersList.get("authorization");

    if (!authorization) {
      return NextResponse.json({
        success: false,
        message: "Unauthorized: Missing Authorization header.",
      } as ApiResponse<null>);
    }

    const sessionToken = authorization.replace("Bearer ", "");
    const session = await prisma.session.findUnique({
      where: { id: sessionToken },
      include: { user: true },
    });

    if (!session || !session.user) {
      return NextResponse.json({
        success: false,
        message: "Unauthorized: Invalid session.",
      } as ApiResponse<null>);
    }

    const userId = session.user.id;
    let isLiked = false;

    // Utilise une transaction pour garantir que les opérations sont atomiques
    await prisma.$transaction(async (prisma) => {
      const existingLike = await prisma.like.findFirst({
        where: { postId: postId, userId: userId },
      });

      if (existingLike) {
        // Si le like existe, on le supprime
        await prisma.like.delete({
          where: {
            userId_postId: { userId, postId },
          },
        });
        isLiked = false;
      } else {
        // Sinon, on le crée
        await prisma.like.create({
          data: {
            postId: postId,
            userId: userId,
          },
        });

        // Crée une notification si l'utilisateur n'est pas l'auteur du post
        const post = await prisma.post.findUnique({
          where: { id: postId },
          select: { userId: true },
        });

        if (post && post.userId !== userId) {
          await prisma.notification.create({
            data: {
              issuerId: userId,
              recipientId: post.userId,
              postId: postId,
              type: "LIKE",
            },
          });
        }
        isLiked = true;
      }
    });

    // Compte le nombre de likes après la transaction
    const likesCount = await prisma.like.count({
      where: { postId: postId },
    });

    return NextResponse.json({
      success: true,
      message: "Like action successful.",
      data: { isLiked, likesCount },
    } as ApiResponse<{ isLiked: boolean; likesCount: number }>);
  } catch (error) {
    console.error("Error in like endpoint:", error);
    return NextResponse.json({
      success: false,
      message: "Something went wrong. Please try again.",
    } as ApiResponse<null>);
  }
}
