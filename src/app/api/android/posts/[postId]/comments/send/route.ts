// /api/android/posts/[postId]/like/route.ts
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import {
  ApiResponse,
  VerifiedUser,
  Comment,
  CommentsPage,
} from "../../../../utils/dTypes";
import { getCommentDataIncludes } from "@/lib/types";
import { createCommentSchema } from "@/lib/validation";

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
        deviceId,
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
    // Fin de la vérification de l'appareil
    const userId = session.user.id;

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { userId: true },
    });

    if (!post) {
      return NextResponse.json({
        success: false,
        message: "Post not found.",
      } as ApiResponse<null>);
    }

    const input = await req.json();

    const { content } = createCommentSchema.parse(input);

    const newComment = await prisma.comment.create({
      data: {
        content,
        postId,
        userId,
      },
      include: {
        ...getCommentDataIncludes(userId),
        replies: {
          where: {
            post: {
              userId: post.userId,
            },
          },
          select: {
            id: true,
          },
        },
      },
    });

    const userVerifiedData = newComment.user.verified?.[0];

    const expiresAt = userVerifiedData?.expiresAt?.getTime() || null;
    const canExpire = !!(expiresAt || null);

    const expired =
      canExpire && expiresAt ? new Date().getTime() < expiresAt : false;

    const isVerified = !!userVerifiedData && !expired;

    const verified: VerifiedUser = {
      verified: isVerified,
      type: userVerifiedData?.type,
      expiresAt,
    };

    const commentUser = {
      id: newComment.user.id,
      username: newComment.user.username,
      displayName: newComment.user.displayName,
      avatarUrl: newComment.user.avatarUrl as string | undefined,
      verified,
    };
    const id = newComment.id;
    const author = commentUser;
    const newContent = newComment.content;
    const createdAt = newComment.createdAt.getTime();
    const likes = newComment._count.likes;
    const isLiked = newComment.likes.some((like) => like.userId === userId);
    const isLikedByAuthor = newComment.likes.some(
      (like) => like.userId === newComment.post.userId,
    );
    const isRepliedByAuthor = !!newComment.replies.length;
    const postAuthorId = newComment.post.userId;
    const replies = await prisma.comment.count({
      where: {
        firstLevelCommentId: newComment.id,
      },
    });

    const comment: Comment = {
      id,
      author,
      content: newContent,
      createdAt,
      likes,
      isLiked,
      isLikedByAuthor,
      isRepliedByAuthor,
      postId,
      postAuthorId,
      replies,
    };

    return NextResponse.json({
      success: true,
      message: "Comments sent successfully.",
      data: comment,
    } as ApiResponse<Comment>);
  } catch (error) {
    console.error(error);
    return NextResponse.json({
      success: false,
      message: "Something went wrong. Please try again.",
    } as ApiResponse<null>);
  }
}
