import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import {
  getMessageDataInclude,
  MessageData,
  MessagesSection,
} from "@/lib/types";

export async function GET(
  req: Request,
  { params: { channelId } }: { params: { channelId: string } },
) {
  try {
    const url = new URL(req.url);
    const cursor = url.searchParams.get("cursor") || undefined;
    const pageSize = 10;

    const { user } = await validateRequest();

    if (!user) {
      return Response.json({ error: "Action non autorisée" }, { status: 401 });
    }

    let messages: MessageData[];

    // Vérifier si on récupère des messages d'un canal ou des messages sauvegardés
    if (channelId === `saved-${user.id}`) {
      // Récupérer les messages sauvegardés (envoyés à soi-même)
      messages = await prisma.message.findMany({
        where: {
          senderId: user.id,
          type: "SAVED",
        },
        include: getMessageDataInclude(),
        orderBy: { createdAt: "desc" },
        take: pageSize + 1,
        cursor: cursor ? { id: cursor } : undefined,
      });
      if (messages[0]) {
        // modifier les types des messages qui n'ont pas "created" comme contenu et qui ne sont pas en premier message en "CONTENT"
        messages = messages.map((message) => {
          if (message.content !== `create-${user.id}`) {
            message.type = "CONTENT";
          }
          return message;
        });
      }
    } else {
      // Récupérer les messages d'un canal spécifique
      const channel = await prisma.channel.findFirst({
        where: {
          id: channelId,
        },
      });
      if (!channel) {
        return Response.json(
          { error: "Le canal n'existe pas" },
          { status: 400 },
        );
      }

      messages = await prisma.message.findMany({
        where: { channelId },
        include: getMessageDataInclude(),
        orderBy: { createdAt: "desc" },
        take: pageSize + 1, // Récupère une page supplémentaire pour vérifier s'il y a une page suivante
        cursor: cursor ? { id: cursor } : undefined,
      });
    }

    const nextCursor =
      messages.length > pageSize ? messages[pageSize].id : null;

    const data: MessagesSection = {
      messages: messages.slice(0, pageSize),
      nextCursor,
    };

    return Response.json(data);
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Erreur interne du serveur" },
      { status: 500 },
    );
  }
}
