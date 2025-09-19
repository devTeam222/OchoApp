import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { ApiResponse, User, VerifiedUser } from "../../../utils/dTypes";
import { getUserDataSelect, UserData } from "@/lib/types";
import { get } from "http";

// Endpoint pour récupérer un profil utilisateur par ID
export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } },
) {
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
    console.log(deviceId, deviceTypeHeader, isDeviceLoggedIn);

    if (!isDeviceLoggedIn) {
      return NextResponse.json({
        success: false,
        message: "Appareil non autorisé. Veuillez vous reconnecter.",
        name: "authorization",
        data: null,
      } as ApiResponse<null>);
    }

    // Correction : l'ID de l'utilisateur est dans les params
    const userId = params.userId;

    if (!userId) {
      return NextResponse.json({
        success: false,
        message: "User ID is required",
        name: "no_id",
      } as ApiResponse<null>);
    }

    const user = (await prisma.user.findFirst({
      where: {
        OR: [
          { id: userId },
          { username: userId }, // Permet de chercher par nom d'utilisateur aussi
        ],
      },
      select: getUserDataSelect(currentUser.id),
    })) as UserData | undefined;

    if (!user) {
      return NextResponse.json({
        success: false,
        message: "User not found",
        name: "user_not_found",
      } as ApiResponse<null>);
    }

    const userIsCurrentUser = currentUser.id === user.id;
    if (userIsCurrentUser) {
      return NextResponse.json({
        success: true,
        message: "You can't follow yourself",
        data: currentUser,
      } as ApiResponse<UserData>);
    }

    const userVerifiedData = user.verified?.[0];

    const expiresAt = userVerifiedData?.expiresAt;
    const canExpire = !!(expiresAt ? new Date(expiresAt).getTime() : null);

    const expired = canExpire && expiresAt ? new Date() < expiresAt : false;

    const isVerified = !!userVerifiedData && !expired;

    const verified: VerifiedUser = {
      verified: isVerified,
      type: userVerifiedData?.type,
      expiresAt: userVerifiedData?.expiresAt,
    };

    const isFollowing = user.followers.some(
      (follower) => follower.followerId === currentUser.id,
    );

    if (isFollowing) {
      // Si l'utilisateur est déjà suivi, on le retire des followers
      await prisma.$transaction([
        prisma.follow.deleteMany({
          where: {
            followerId: currentUser.id,
            followingId: user.id,
          },
        }),
        prisma.notification.deleteMany({
          where: {
            issuerId: currentUser.id,
            recipientId: user.id,
            type: "FOLLOW",
          },
        }),
      ]);
    } else {
      // Si l'utilisateur n'est pas suivi, on l'ajoute aux followers
      await prisma.$transaction([
        prisma.follow.create({
          data: {
            followerId: currentUser.id,
            followingId: user.id,
          },
        }),
        prisma.notification.create({
          data: {
            issuerId: currentUser.id,
            recipientId: user.id,
            type: "FOLLOW",
          },
        }),
      ]);
    }
    // Recalculer le nombre de followers et posts
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
        select: getUserDataSelect(currentUser.id),
    }) as UserData | null;
    

    const finalUser: User = {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl || undefined,
      bio: user.bio || undefined,
      verified,
      createdAt: user.createdAt.getTime(),
      lastSeen: user.lastSeen.getTime(),
      followersCount: updatedUser?._count.followers || 0,
      postsCount: updatedUser?._count.posts || 0,
    };

    return NextResponse.json({
      success: true,
      message: "User follow status updated",
      data: finalUser,
    } as ApiResponse<User>);
  } catch (error) {
    console.error(error);
    return NextResponse.json({
      success: false,
      message: "An unexpected error occurred",
      name: "unknown",
    } as ApiResponse<null>);
  }
}
