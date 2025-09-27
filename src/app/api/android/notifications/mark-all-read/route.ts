// api/android/notifications
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import {
  ApiResponse,
  NotificationData,
  NotificationsPage,
  User,
  VerifiedUser,
} from "../../utils/dTypes";

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


    await prisma.notification.updateMany({
      where: {
        recipientId: currentUserId,
        read: false,
      },
      data: {
        read: true,
      },
    });
    return NextResponse.json({
      success: true,
      message: "Toutes les notifications ont été marquées comme lues.",
      data: null,
    } as ApiResponse<null>);
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
