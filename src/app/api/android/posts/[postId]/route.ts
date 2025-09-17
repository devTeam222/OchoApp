import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { ApiResponse } from "../../utils/dTypes";
import { getPostDataIncludes, UserData } from "@/lib/types";
import { calculateRelevanceScore } from "@/lib/postScore";
import { get } from "http";

export async function GET(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const { postId } = params;
    const authHeader = req.headers.get("Authorization");
    const sessionToken = authHeader?.split(" ")[1];

    if (!sessionToken) {
      return Response.json(
        { success: false, message: "Action non autorisée" }
      );
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
      return Response.json(
        { success: false, message: "Action non autorisée" }
      );
    }
    const user = { ...session.user } as unknown as UserData;

     // 1. Récupérer les informations de l'appareil à partir des en-têtes
    const deviceId = req.headers.get("X-Device-ID");
    const deviceTypeHeader = req.headers.get("X-Device-Type");

    // 2. Vérifier la présence des en-têtes essentiels pour l'appareil
    if (!deviceId || !deviceTypeHeader) {
      return Response.json({
        success: false,
        message: "En-têtes d'appareil manquants (X-Device-ID, X-Device-Type).",
        name: "missing_device_headers",
      });
    }
    const device = await prisma.device.findFirst({
      where: {
        deviceId
      },
    });
    const isDeviceLoggedIn = device?.logged;
    console.log(deviceId, deviceTypeHeader, isDeviceLoggedIn);

    if (!isDeviceLoggedIn) {
      return Response.json({
        success: false,
        message: "Appareil non autorisé. Veuillez vous reconnecter.",
        name: "authorization",
        data: null,
      } as ApiResponse<null>);
    }

  const [allScores, post] = await prisma.$transaction([
    prisma.postUserScore.findMany({
      where: {
        postId: postId,
      },
      select: {
        userId: true,
        relevanceScore: true,
      },
    }),
    prisma.post.findUnique({
      where: {
        id: postId,
      },
      include: getPostDataIncludes(user.id),
    }),
  ]);

  if (!allScores || !post) {
    return Response.json({}, { status: 404 });
  }

  const newUserScore = calculateRelevanceScore(post, user);

  const postScore =
    newUserScore +
    allScores
      .filter((score) => score.userId !== user.id)
      .reduce((acc, score) => acc + score?.relevanceScore, 0);

  await prisma.$transaction([
    prisma.post.update({
      where: {
        id: postId,
      },
      data: {
        relevanceScore: postScore,
      },
    }),
    prisma.postUserScore.upsert({
      where: {
        postId_userId: {
          postId,
          userId: user.id,
        },
      },
      update: {
        relevanceScore: newUserScore,
      },
      create: {
        postId,
        userId: user.id,
        relevanceScore: newUserScore,
      },
    }),
  ]);
  return Response.json({ success: true });
  } catch (error) {
    console.error("Error getting post:", error);
    return Response.json(
      { success: false, message: "Erreur lors de la récupération du post"});
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const authHeader = req.headers.get("Authorization");
    const sessionToken = authHeader?.split(" ")[1];

    if (!sessionToken) {
      return Response.json(
        { success: false, message: "Action non autorisée" }
      );
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
      return Response.json(
        { success: false, message: "Action non autorisée" }
      );
    }

     // 1. Récupérer les informations de l'appareil à partir des en-têtes
    const deviceId = req.headers.get("X-Device-ID");
    const deviceTypeHeader = req.headers.get("X-Device-Type");

    // 2. Vérifier la présence des en-têtes essentiels pour l'appareil
    if (!deviceId || !deviceTypeHeader) {
      return Response.json({
        success: false,
        message: "En-têtes d'appareil manquants (X-Device-ID, X-Device-Type).",
        name: "missing_device_headers",
      });
    }
    const device = await prisma.device.findFirst({
      where: {
        deviceId
      },
    });
    const isDeviceLoggedIn = device?.logged;
    console.log(deviceId, deviceTypeHeader, isDeviceLoggedIn);

    if (!isDeviceLoggedIn) {
      return Response.json({
        success: false,
        message: "Appareil non autorisé. Veuillez vous reconnecter.",
        name: "authorization",
        data: null,
      } as ApiResponse<null>);
    }

    const { postId } = params;

    if (!postId) {
      return Response.json(
        { success: false, message: "ID de post manquant" }
      );
    }

    // On vérifie si l'utilisateur est bien l'auteur du post
    const postToDelete = await prisma.post.findUnique({
      where: {
        id: postId,
      },
    });

    if (!postToDelete) {
      return Response.json(
        { success: false, message: "Post non trouvé" },
        { status: 404 }
      );
    }

    if (postToDelete.userId !== session.user.id) {
      return Response.json(
        { success: false, message: "Vous n'avez pas la permission de supprimer ce post" }
      );
    }

    await prisma.post.delete({
      where: {
        id: postId,
      },
    });

    return Response.json({ success: true, message: "Post supprimé avec succès" });
  } catch (error) {
    console.error("Error deleting post:", error);
    return Response.json(
      { success: false, message: "Erreur lors de la suppression du post" }
    );
  }
}
