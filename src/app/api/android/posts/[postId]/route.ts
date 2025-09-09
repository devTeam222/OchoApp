import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
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

    const { id } = params;

    if (!id) {
      return Response.json(
        { success: false, message: "ID de post manquant" }
      );
    }

    // On vérifie si l'utilisateur est bien l'auteur du post
    const postToDelete = await prisma.post.findUnique({
      where: {
        id: id,
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
        id: id,
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
