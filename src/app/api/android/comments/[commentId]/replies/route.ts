// /api/android/posts/[postId]/like/route.ts
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import {
  ApiResponse,
  VerifiedUser,
  Reply,
  RepliesPage,
} from "../../../utils/dTypes";
import { getCommentDataIncludes } from "@/lib/types";

export async function GET(
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

    const pageSize = 3;
    const cursor = req.nextUrl.searchParams.get("cursor") || undefined;

    const comments = await prisma.comment.findMany({
      where: { firstLevelCommentId: commentId },
      orderBy: { createdAt: "desc" },
      take: pageSize + 1,
      cursor: cursor ? { id: cursor } : undefined,
      include: getCommentDataIncludes(userId),
    });

    const replies = comments.map((comment) => {
      const userVerifiedData = comment.user.verified?.[0];

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
        id: comment.user.id,
        username: comment.user.username,
        displayName: comment.user.displayName,
        avatarUrl: comment.user.avatarUrl,
        verified,
      };
      const id = comment.id;
      const author = commentUser;
      const content = comment.content;
      const createdAt = comment.createdAt.getTime();
      const likes = comment._count.likes;
      const isLiked = comment.likes.some((like) => like.userId === userId);
      const isLikedByAuthor = comment.likes.some((like) => like.userId === comment.post.userId);
      const postId = comment.postId;
      const postAuthorId = comment.post.userId;
      const replies = comment._count.replies;
      const firstLevelCommentId = comment.firstLevelCommentId!;
      const firstLevelCommentAuthorId = comment.firstLevelComment!.userId;
      const commentId = comment.commentId;
      const commentAuthorId = comment.comment!.userId;

      const commentAuthorData = comment.comment!.user.verified?.[0];

      const commentAuthorExpiresAt =
        commentAuthorData?.expiresAt?.getTime() || null;
      const commentAuthorCanExpire = !!(commentAuthorExpiresAt || null);
        const commentAuthorExpired = commentAuthorCanExpire && commentAuthorExpiresAt
        ? new Date().getTime() < commentAuthorExpiresAt
        : false;
        const commentAuthorIsVerified = !!commentAuthorData && !commentAuthorExpired;

      const verifiedCommentAuthor: VerifiedUser = {
        verified: commentAuthorIsVerified,
        type: commentAuthorData?.type,
        expiresAt: commentAuthorExpiresAt,
      };
      const commentAuthor = {
        id: comment.comment!.user.id,
        username: comment.comment!.user.username,
        displayName: comment.comment!.user.displayName,
        avatarUrl: comment.comment!.user.avatarUrl,
        verified: verifiedCommentAuthor,
      }
      return {
        id,
        author,
        content,
        createdAt,
        likes,
        isLiked,
        isLikedByAuthor,
        postId,
        postAuthorId,
        replies,
        commentId,
        commentAuthorId,
        commentAuthor,
        firstLevelCommentId,
        firstLevelCommentAuthorId,
      } as Reply;
    });

    const nextCursor =
      comments.length > pageSize ? comments[pageSize].id : null;

    const responseData: RepliesPage = {
      replies: replies.slice(0, pageSize),
      nextCursor,
    };
    return NextResponse.json({
      success: true,
      message: "Comments retrieved successfully.",
      data: responseData,
    } as ApiResponse<RepliesPage>);
  } catch (error) {
    console.error("Error in like endpoint:", error);
    return NextResponse.json({
      success: false,
      message: "Something went wrong. Please try again.",
    } as ApiResponse<null>);
  }
}
