// /api/android/posts/[postId]/like/route.ts
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { ApiResponse } from "../../../utils/dTypes";

export async function POST(
  req: NextRequest,
  { params: { commentId } }: { params: { commentId: string } },
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

     // 1. Récupérer les informations de l'appareil à partir des en-têtes
    const deviceId = req.headers.get("X-Device-ID");
    const deviceTypeHeader = req.headers.get("X-Device-Type");

    // 2. Vérifier la présence des en-têtes essentiels pour l'appareil
    if (!deviceId || !deviceTypeHeader) {
      return NextResponse.json({
        success: false,
        message: "En-têtes d'appareil manquants (X-Device-ID, X-Device-Type).",
        name: "missing_device_headers",
      });
    }
    const device = await prisma.device.findFirst({
      where: {
        deviceId
      },
    });
    const isDeviceLoggedIn = device?.logged;
    console.log(deviceId, deviceTypeHeader, isDeviceLoggedIn);

    if (!isDeviceLoggedIn) {
      return NextResponse.json({
        success: false,
        message: "Appareil non autorisé. Veuillez vous reconnecter.",
        name: "authorization",
        data: null,
      } as ApiResponse<null>);
    }

    const userId = session.user.id;
    let isLiked = false;

    // Utilise une transaction pour garantir que les opérations sont atomiques
    await prisma.$transaction(async (prisma) => {
      const existingLike = await prisma.commentLike.findFirst({
        where: { commentId, userId: userId },
      });

      if (existingLike) {
        // Si le like existe, on le supprime
        await prisma.commentLike.delete({
          where: {
            userId_commentId: { userId, commentId },
          },
        });
        isLiked = false;
      } else {
        const comment = await prisma.comment.findUnique({
          where: { id: commentId },
          select: { postId: true, userId: true },
        });
        if (!comment) {
          return NextResponse.json({
            success: false,
            message: "Comment not found.",
            name: "not_found",
          } as ApiResponse<null>);
        }
        // Sinon, on le crée
        await prisma.commentLike.create({
          data: {
            commentId,
            userId,
          },
        });

        // Crée une notification si l'utilisateur n'est pas l'auteur du post
        const post = await prisma.post.findUnique({
          where: { id: comment.postId },
          select: { userId: true },
        });

        if (post && post.userId !== userId) {
          await prisma.notification.create({
            data: {
              issuerId: userId,
              recipientId: post.userId,
              postId: comment.postId,
              commentId,
              type: "COMMENT_LIKE",
            },
          });
        }
        isLiked = true;
      }
    });

    // Compte le nombre de likes après la transaction
    const likesCount = await prisma.commentLike.count({
      where: { commentId },
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