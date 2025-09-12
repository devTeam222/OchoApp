import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { ApiResponse, User, VerifiedUser } from "../../utils/dTypes";
import { UserData } from "@/lib/types";

// Endpoint pour récupérer un profil utilisateur par ID
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
    const currentUser: UserData | undefined = session?.user;
    
    if (!currentUser) {
      return NextResponse.json({
        success: false,
        message: "Action non autorisée",
        name: "authorization",
        data: null,
      } as ApiResponse<null>);
    }
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID is required",
        } as ApiResponse<null>,
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
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
    }) as UserData | undefined;

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        } as ApiResponse<null>,
        { status: 404 },
      );
    }

    const verified: VerifiedUser = {
      verified: (!!user.verified?.[0].expiresAt &&
      user.verified?.[0].expiresAt > new Date()) || false,
      type: user.verified?.[0]?.type,
      expiresAt: user.verified?.[0]?.expiresAt,
    };

    const finalUser: User = {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl || undefined,
      bio: user.bio || undefined,
      verified,
      createdAt: user.createdAt.getTime(),
      lastSeen: user.lastSeen.getTime(),
      followersCount: user._count.followers,
      postsCount: user._count.posts,
    };

    return NextResponse.json({
      success: true,
      message: "User retrieved successfully",
      data: finalUser,
    } as ApiResponse<User>);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        success: false,
        message: "An unexpected error occurred",
      } as ApiResponse<null>,
    );
  }
}
