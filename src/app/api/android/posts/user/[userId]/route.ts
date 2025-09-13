import prisma from "@/lib/prisma";
import { getPostDataIncludes } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import {
  ApiResponse,
  Post,
  PostsPage,
  User,
  VerifiedUser,
} from "../../../utils/dTypes";

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } },
) {
  try {
    const authHeader = req.headers.get("Authorization");
    const session_token = authHeader?.split(" ")[1];
    const { userId } = params;

    // Récupérer l'ID de l'utilisateur actuel via le token de session
    const session = await prisma.session.findFirst({
      where: {
        id: session_token,
      },
      select: {
        user: {
          select: {
            id: true,
          },
        },
      },
    });

    const currentUserId = session?.user?.id;
    if (!currentUserId) {
      return NextResponse.json({
        success: false,
        message: "Action non autorisée",
        name: "authorization",
        data: null,
      } as ApiResponse<null>);
    }

    const cursor = req.nextUrl.searchParams.get("cursor") || undefined;
    const pageSize = 5;

    // Récupérer les posts de l'utilisateur
    const posts = await prisma.post.findMany({
      where: {
        userId: userId,
        // Exclure les posts avec des pièces jointes comme dans votre modèle
        NOT: {
          attachments: {
            some: {},
          },
        },
      },
      // Utiliser la fonction getPostDataIncludes pour la cohérence
      include: getPostDataIncludes(currentUserId),
      orderBy: { createdAt: "desc" },
      take: pageSize + 1,
      cursor: cursor ? { id: cursor } : undefined,
    });

    // Convertir les posts pour correspondre au type 'Post'
    const finalPosts = posts.slice(0, pageSize).map((post) => {
      const userVerifiedData = post.user.verified?.[0];

      const expiresAt = userVerifiedData.expiresAt;
      const canExpire = !!(expiresAt ? new Date(expiresAt).getTime() : null);

      const expired = canExpire && expiresAt ? new Date() < expiresAt : false;

      const isVerified = !!userVerifiedData && !expired;

      const verified: VerifiedUser = {
        verified: isVerified,
        type: userVerifiedData?.type,
        expiresAt: userVerifiedData?.expiresAt,
      };

      const author: User = {
        id: post.userId,
        username: post.user.username,
        displayName: post.user.displayName,
        avatarUrl: post.user.avatarUrl || undefined,
        bio: post.user.bio || undefined,
        verified,
        createdAt: post.user.createdAt.getTime(),
        lastSeen: post.user.lastSeen.getTime(),
      };

      const finalPost = {
        id: post.id,
        author,
        content: post.content,
        createdAt: post.createdAt.getTime(),
        attachments: post.attachments,
        gradient: post.gradient || undefined,
        likes: post._count.likes,
        comments: post._count.comments,
        isLiked: post.likes.some((like) => like.userId === currentUserId),
      };
      return finalPost;
    });

    const nextCursor = posts.length > pageSize ? posts[pageSize].id : null;

    const postsData: PostsPage = {
      posts: finalPosts,
      nextCursor,
    };

    return NextResponse.json({
      success: true,
      message: "Posts de l'utilisateur récupérés avec succès",
      data: postsData,
    } as ApiResponse<PostsPage>);
  } catch (error) {
    console.error(error);
    return NextResponse.json({
      success: false,
      message: "Erreur interne du serveur",
      name: "server-error",
      data: null,
    } as ApiResponse<null>);
  }
}
