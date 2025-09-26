import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { ApiResponse, User, VerifiedUser } from "../../utils/dTypes";
import { getUserDataSelect, UserData } from "@/lib/types";

// Endpoint pour récupérer les suggestions d'utilisateurs
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

    if (!isDeviceLoggedIn) {
      return NextResponse.json({
        success: false,
        message: "Appareil non autorisé. Veuillez vous reconnecter.",
        name: "authorization",
        data: null,
      } as ApiResponse<null>);
    }

    // Exécuter la requête Prisma pour trouver les utilisateurs à suggérer
    const usersToFollow = await prisma.user.findMany({
      where: {
        NOT: {
          id: currentUser.id,
        },
        followers: {
          none: {
            followerId: currentUser.id,
          },
        },
      },
      select: getUserDataSelect(currentUser.id),
      orderBy: {
        followers: {
          _count: "desc",
        },
      },
      take: 5,
    });

    // Mapper les résultats pour correspondre à la structure de données attendue par le client
    const suggestedUsers = usersToFollow.map((user: UserData) => {
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

      let isFollowing = user.followers.some(
        (follower) => follower.followerId === currentUser.id,
      );

      return {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl || undefined,
        bio: user.bio || undefined,
        verified,
        createdAt: user.createdAt.getTime(),
        lastSeen: user.lastSeen.getTime(),
        followersCount: user?._count.followers || 0,
        postsCount: user?._count.posts || 0,
        isFollowing,
      };
    });

    return NextResponse.json({
      success: true,
      message: "Suggested users fetched successfully",
      data: suggestedUsers,
    } as ApiResponse<User[]>);
  } catch (error) {
    console.error(error);
    return NextResponse.json({
      success: false,
      message: "An unexpected error occurred",
      name: "unknown",
      data: null,
    } as ApiResponse<null>);
  }
}
