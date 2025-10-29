import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "../../utils/dTypes";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export async function DELETE(
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

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { userId: true },
    });
    if (!comment) {
      return NextResponse.json({
        success: false,
        message: "Comment not found.",
        name: "not_found",
      } as ApiResponse<null>);
    }
    if (comment.userId !== userId) {
      return NextResponse.json({
        success: false,
        message: "Forbidden: You can only delete your own comments.",
        name: "forbidden",
      } as ApiResponse<null>);
    }
    await prisma.comment.delete({
      where: { id: commentId },
    });
    return NextResponse.json({
      success: true,
      message: "Comment deleted successfully.",
    } as ApiResponse<null>);
  } catch (error) {
    
  }
  return NextResponse.json({
    success: true,
    message: "Replies endpoint is operational.",
  } as ApiResponse<null>);
}