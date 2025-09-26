// api/android/notifications
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import {
    ApiResponse,
    NotificationData,
    NotificationsPage,
    User,
    VerifiedUser,
} from "../utils/dTypes";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get("Authorization");
        const sessionToken = authHeader?.split(" ")[1];

        if (!sessionToken) {
            return NextResponse.json({
                success: false,
                message: "Action non autorisée",
                name: "authorization",
            } as ApiResponse<null>);
        }

        const session = await prisma.session.findUnique({
            where: {
                id: sessionToken,
            },
            include: {
                user: true,
            },
        });

        const currentUserId = session?.user?.id;

        if (!currentUserId) {
            return NextResponse.json({
                success: false,
                message: "Action non autorisée",
                name: "authorization",
            } as ApiResponse<null>);
        }

        const deviceId = req.headers.get("X-Device-ID");
        const deviceTypeHeader = req.headers.get("X-Device-Type");

        if (!deviceId || !deviceTypeHeader) {
            return NextResponse.json({
                success: false,
                message: "En-têtes d'appareil manquants (X-Device-ID, X-Device-Type).",
                name: "missing_device_headers",
            } as ApiResponse<null>);
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

        const cursor = req.nextUrl.searchParams.get("cursor") || undefined;
        const pageSize = 5;

        const notifications = await prisma.notification.findMany({
            where: {
                recipientId: currentUserId,
            },
            include: {
                issuer: {
                    include: {
                        verified: true,
                    },
                },
                post: true,
                comment: {
                    select: {
                        content: true,
                    }
                },
            },
            orderBy: { createdAt: "desc" },
            take: pageSize + 1,
            cursor: cursor ? { id: cursor } : undefined,
        });

        const finalNotifications = notifications.slice(0, pageSize).map((notification) => {
            const issuer = notification.issuer;
            const userVerifiedData = issuer.verified?.[0];
            const expiresAt = userVerifiedData?.expiresAt;
            const canExpire = !!(expiresAt ? new Date(expiresAt).getTime() : null);
            const expired = canExpire && expiresAt ? new Date() < expiresAt : false;
            const isVerified = !!userVerifiedData && !expired;

            const verified: VerifiedUser = {
                verified: isVerified,
                type: userVerifiedData?.type || null,
                expiresAt: userVerifiedData?.expiresAt || null,
            };

            const issuerUser: User = {
                id: issuer.id,
                username: issuer.username,
                displayName: issuer.displayName,
                avatarUrl: issuer.avatarUrl || undefined,
                bio: issuer.bio || undefined,
                verified,
                createdAt: issuer.createdAt.getTime(),
                lastSeen: issuer.lastSeen.getTime(),
            };
            return {
                ...notification,
                issuer: issuerUser,
                createdAt: notification.createdAt.getTime(),
                read: notification.read,
            } as NotificationData;
        });

        const nextCursor = notifications.length > pageSize ? notifications[pageSize].id : null;

        const notificationsPage: NotificationsPage = {
            notifications: finalNotifications,
            cursor: nextCursor,
            hasMore: notifications.length > pageSize
        };

        return NextResponse.json({
            success: true,
            message: "Notifications récupérées avec succès",
            data: notificationsPage,
        } as ApiResponse<NotificationsPage>);
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
