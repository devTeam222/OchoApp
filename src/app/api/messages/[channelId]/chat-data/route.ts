import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import {
  ChannelData,
  getMessageDataInclude,
  getUserDataSelect,
  MessageData,
} from "@/lib/types";

export async function GET(
  req: Request,
  { params: { channelId } }: { params: { channelId: string } },
) {
  try {
    const url = new URL(req.url);

    const { user } = await validateRequest();

    if (!user) {
      return Response.json({ error: "Action non autorisée" }, { status: 401 });
    }
    const userId = user.id;

    // Vérifier si on récupère des messages d'un canal ou des messages sauvegardés
    if (channelId === `saved-${user.id}`) {
      const existingSavedMsgs = await prisma.message.findMany({
        where: {
          senderId: {
            equals: userId,
          },
          type: {
            equals: "SAVED",
          },
        },
        include: getMessageDataInclude(),
        take: 1,
        orderBy: { createdAt: "desc" },
      });
      if (!existingSavedMsgs[0]) {
        const channel: ChannelData = {
          id: `saved-${userId}`,
          name: null,
          privilege: "MANAGE",
          members: [
            {
              user,
              userId,
              type: "OWNER",
              joinedAt: user.createdAt,
              leftAt: null,
            },
          ],
          maxMembers: 300,
          messages: [],
          isGroup: false,
          createdAt: existingSavedMsgs[length - 1]?.createdAt || new Date(),
        };
        return Response.json(channel);
      }
      // Récupérer les messages sauvegardés (envoyés à soi-même)
      const channel: ChannelData = {
        id: `saved-${userId}`,
        name: null,
        privilege: "MANAGE",
        members: [
          {
            user,
            userId,
            type: "OWNER",
            joinedAt: user.createdAt,
            leftAt: null,
          },
        ],
        maxMembers: 300,
        messages: [],
        isGroup: false,
        createdAt: existingSavedMsgs[length - 1]?.createdAt || new Date(),
      };
      return Response.json(channel);
    } else {
      const channelData = await prisma.channel.findFirst({
        where: {
          id: channelId,
        },
      });

      if (!channelData) {
        return Response.json(
          { error: "Le canal n'existe pas" },
          { status: 400 },
        );
      }
      // Récupérer les membres d'un canal spécifique
      const membersData = await prisma.channelMember.findMany({
        where: {
          channelId,
        },
      });
      const membersToFilter = await Promise.all(
        membersData.map(async (member) => {
          if (!member.userId || !member) {
            return null; // retournez null si aucune userId
          }

          const user = await prisma.user.findUnique({
            where: {
              id: member.userId,
            },
            select: getUserDataSelect(userId),
          });

          return {
            user,
            userId: member.userId,
            type: member.type,
            joinedAt: member.joinedAt,
            leftAt: member.leftAt,
          };
        }),
      );
      const messages: MessageData[] = []
      const members = membersToFilter.filter((member) => member !== null);
      const channel: ChannelData = {
        ...channelData,
        members,
        messages,
      };
      return Response.json(channel);
    }

  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Erreur interne du serveur" },
      { status: 500 },
    );
  }
}
