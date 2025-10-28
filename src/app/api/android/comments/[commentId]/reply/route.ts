import { NextRequest, NextResponse } from "next/server";
import { ApiResponse, Reply, User, VerifiedUser } from "../../../utils/dTypes";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { createCommentSchema } from "@/lib/validation";
import { getCommentDataIncludes } from "@/lib/types";

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
      const {postId, firstLevelCommentId, content} = await req.json();
  
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
  
      const { content: validatedContent } = createCommentSchema.parse(input);
  
      const newReply = await prisma.comment.create({
        data: {
          content,
          postId,
          userId,
          firstLevelCommentId,
          commentId,
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
          firstLevelComment: {
            select: {
              user: true,
            }
          },
          comment: {
            select: {
              user: true,
            }
          }
        },
      });
  
      
      const replyUser = toUser(newReply.user);
      const id = newReply.id;
      const author = replyUser;
      const newContent = newReply.content;
      const createdAt = newReply.createdAt.getTime();
      const likes = newReply._count.likes;
      const isLiked = newReply.likes.some((like) => like.userId === userId);
      const isLikedByAuthor = newReply.likes.some(
        (like) => like.userId === newReply.post.userId,
      );
      const postAuthorId = newReply.post.userId;
      const replies = await prisma.comment.count({
        where: {
          firstLevelCommentId: newReply.id,
        },
      });

      const commentAuthor = toUser(newReply.comment?.user);
  
      const reply: Reply = {
        id,
        author,
        content: newContent,
        createdAt,
        likes,
        isLiked,
        isLikedByAuthor,
        postId,
        postAuthorId,
        replies,
        firstLevelCommentId,
        firstLevelCommentAuthorId: newReply.firstLevelComment?.user.id || null,
        commentId: newReply.commentId,
        commentAuthorId: commentAuthor ? commentAuthor.id : null,
        commentAuthor,

      };
  
      return NextResponse.json({
        success: true,
        message: "Comments sent successfully.",
        data: reply,
      } as ApiResponse<Reply>);
    } catch (error) {
      console.error(error);
      return NextResponse.json({
        success: false,
        message: "Something went wrong. Please try again.",
      } as ApiResponse<null>);
    }
}


function toUser(user: any): User {
      const userVerifiedData = user.verified?.[0];
  
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
  
      return {
        id: user.user.id,
        username: user.user.username,
        displayName: user.user.displayName,
        avatarUrl: user.user.avatarUrl,
        verified,
      } as User;
}