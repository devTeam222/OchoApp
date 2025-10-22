// api/android/notifications
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import {
  ApiResponse,
} from "../../../utils/dTypes";

export async function POST(req: NextRequest, { params }: { params: { notificationId: string } }) {
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

    const notificationId = params.notificationId;

    const notification = await prisma.notification.findUnique({
      where: {
        id: notificationId,
        recipientId: currentUserId,
      },
    });
    if (!notification) {
      return NextResponse.json({
        success: false,
        message: "Notification non trouvée ou accès refusé.",
        name: "not_found",
      } as ApiResponse<null>);
    }
      await prisma.notification.update({
      where: {
        id: notificationId,
      },
      data: {
        read: true,
      },
    });
    return NextResponse.json({
      success: true,
      message: "Notification marquée comme lue.",
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
