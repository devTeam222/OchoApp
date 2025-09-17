import { calculateRelevanceScore } from "@/lib/postScore";
import prisma from "@/lib/prisma";
import { getPostDataIncludes, UserData } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import {
  ApiResponse,
  Attachment,
  Post,
  PostsPage,
  User,
  VerifiedUser,
} from "../../utils/dTypes";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const session_token = authHeader?.split(" ")[1];
    const session = await prisma.session.findFirst({
      where: {
        id: session_token,
      },
      select: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            bio: true,
            lastSeen: true,
            createdAt: true,
            following: {
              select: {
                followerId: true,
              },
              take: 0,
            },
            followers: {
              select: {
                followerId: true,
              },
              take: 0,
            },
            verified: true,
            _count: true,
          },
        },
      },
    });
    const user: UserData | undefined = session?.user;

    const cursor = req.nextUrl.searchParams.get("cursor") || undefined;
    const pageSize = 5;

    if (!user) {
      return NextResponse.json({
        success: false,
        message: "Action non autorisée",
        name: "authorization",
        data: null,
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

    const isDeviceLoggedIn = await prisma.device.findFirst({
      where: {
        deviceId: deviceId,
        sessionId: session_token,
        logged: true,
      },
    })
    if (!isDeviceLoggedIn) {
      return NextResponse.json({
        success: false,
        message: "Appareil non autorisé. Veuillez vous reconnecter.",
        name: "unauthorized_device",
        data: null,
      } as ApiResponse<null>);
    }

    // Récupération des posts
    const posts = await prisma.post.findMany({
      include: getPostDataIncludes(user.id),
      orderBy: { createdAt: "desc" },
      take: pageSize + 1,
      cursor: cursor ? { id: cursor } : undefined,
    });

    const postsWithScores = posts.slice(0, pageSize).map((post) => ({
      ...post,
      relevanceScore: calculateRelevanceScore(
        post,
        user,
        posts[0]?.id || undefined,
      ),
    }));

    const sortedPosts = postsWithScores
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .map((post) => {
        const userVerifiedData = post.user.verified?.[0];

        const expiresAt = userVerifiedData?.expiresAt;
        const canExpire = !!(expiresAt ? new Date(expiresAt).getTime() : null);

        const expired = canExpire && expiresAt ? new Date() < expiresAt : false;

        const isVerified = !!userVerifiedData && !expired;

        const verified: VerifiedUser = {
          verified: isVerified,
          type: userVerifiedData?.type,
          expiresAt: userVerifiedData?.expiresAt,
        };
        const attachments: Attachment[] = post.attachments;
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
        const createdAt: number = post.createdAt.getTime();
        const content: string = post.content;
        const gradient: number | undefined = post.gradient || undefined;
        const id: string = post.id;
        const likes = post._count.likes;
        const comments = post._count.comments;
        const isLiked = post.likes.some((like) => like.userId === user.id);
        const isBookmarked = post.bookmarks.some(
          (bookmark) => bookmark.userId === user.id,
        );

        const finalPost: Post = {
          id,
          author,
          content,
          createdAt,
          attachments,
          gradient,
          likes,
          comments,
          isLiked,
          isBookmarked,
        };
        return finalPost;
      });

    const nextCursor = posts.length > pageSize ? posts[pageSize].id : null;

    const data: PostsPage = {
      posts: sortedPosts,
      nextCursor,
    };
    console.log(data);
    

    return NextResponse.json({
      success: true,
      message: "Posts retrieved successfully",
      data,
    } as ApiResponse<PostsPage>);
  } catch (error) {
    console.error(error);

    return NextResponse.json({
      success: false,
      message: "Internal server error",
      name: "server-error",
      data: null,
    } as ApiResponse<null>);
  }
}
