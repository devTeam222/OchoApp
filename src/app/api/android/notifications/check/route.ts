// api/android/notifications/check
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import {
  ApiResponse,
  NotificationData,
  User,
  VerifiedUser,
  Comment,
} from "../../utils/dTypes";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const sessionToken = authHeader?.split(" ")[1];

    if (!sessionToken) {
      return NextResponse.json({
        success: false,
        message: "Action non autorisée",
      });
    }

    const session = await prisma.session.findUnique({
      where: {
        id: sessionToken,
      },
      include: {
        user: true,
      },
    });

    if (!session?.user) {
      return NextResponse.json({
        success: false,
        message: "Action non autorisée",
        name: "authorization",
      });
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
    const userId = session.userId;
    // Récupérer le timestamp de la dernière récupération depuis l'appareil
    const lastFetchedDate =
      req.nextUrl.searchParams.get("lastFetchedDate") || 0;

    let hasNewNotifications = false;
    let notificationCount = 0;

    const lastFetchedTimestamp = parseInt(lastFetchedDate || "", 10);
    const unreadCount = await prisma.notification.count({
      where: {
        recipientId: userId,
        read: false,
      },
    });

    const newNotifications = await prisma.notification.findMany({
      where: {
        recipientId: userId,
        read: false,
      },
      include: {
        issuer: {
          select: {
            verified: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        comment: {
          select: {
            id: true,
            content: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });
    const notifications: NotificationData[] = newNotifications.map((notif) => {
      const userVerifiedData = notif.issuer.verified?.[0];
      const expiresAt = userVerifiedData?.expiresAt;
      const canExpire = !!(expiresAt ? new Date(expiresAt).getTime() : null);
      const expired =
        canExpire && expiresAt
          ? new Date().getTime() > new Date(expiresAt).getTime()
          : false;
      const isVerified = !!userVerifiedData && !expired;

      const verified: VerifiedUser = {
        verified: isVerified,
        type: userVerifiedData?.type || null,
        // On renvoie un timestamp en millisecondes, pas une chaîne de caractères
        expiresAt: expiresAt ? new Date(expiresAt).getTime() : null,
      };

      const issuer: User = {
        id: notif.issuerId,
        username: notif.issuer.username,
        displayName: notif.issuer.displayName,
        avatarUrl: notif.issuer.avatarUrl || undefined,
        verified,
      };
      const comment: Comment | null = notif.comment
        ? {
            id: notif.comment.id,
            content: notif.comment.content,
            createdAt: notif.comment.createdAt.getTime(),
            author: null,
            likes: 0,
            isLiked: false,
          }
        : null;
      return {
        id: notif.id,
        type: notif.type,
        read: notif.read,
        issuer,
        recipientId: notif.recipientId,
        comment,
        createdAt: notif.createdAt.getTime(),
      };
    });

    hasNewNotifications = newNotifications.length > 0;
    notificationCount = unreadCount;

    return NextResponse.json({
      success: true,
      data: {
        hasNewNotifications,
        notificationCount,
        notifications
      },
    } as ApiResponse<{
      hasNewNotifications: boolean;
      notificationCount: number;
      notifications: NotificationData[];
    }>);
  } catch (error) {
    console.error(error);
    return NextResponse.json({
      success: false,
      message: "Quelque chose s'est mal passé. Veuillez réessayer.",
    } as ApiResponse<null>);
  }
}
