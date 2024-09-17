import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { ChannelsSection, getChatChannelDataInclude, ChannelData, getMessageDataInclude, MessageData } from "@/lib/types";
import { createChannelSchema } from "@/lib/validation";
import { NextRequest } from "next/server";
import { getUserDataSelect } from "@/lib/types";

export async function GET(req: NextRequest) {
  try {
    const cursor = req.nextUrl.searchParams.get("cursor") || undefined;
    const pageSize = 20;

    const { user: loggedInUser } = await validateRequest();

    if (!loggedInUser) {
      return Response.json({ error: "Action non autorisée" }, { status: 401 });
    }
    
    const user = await prisma.user.findFirst({
      where: {
        id: loggedInUser.id,
      },
      select: getUserDataSelect(loggedInUser.id)
    });

    if (!user) {
      return Response.json({ error: "Action non autorisée" }, { status: 401 });
    }

    // Condition pour paginer sur la date du dernier message (ou date de création si pas de message)
    const lastMessageDateCondition = cursor ? {
      OR: [
        {
          messages: {
            some: {
              createdAt: {
                lt: new Date(cursor),
              },
            },
          },
        },
        {
          AND: [
            {
              messages: {
                none: {},
              },
            },
            {
              createdAt: {
                lt: new Date(cursor),
              },
            },
          ],
        },
      ],
    } : undefined;

    // Récupérer les canaux dans lesquels l'utilisateur est membre avec leur dernier message
    const channels = await prisma.channel.findMany({
      where: {
        members: {
          some: {
            userId: user.id,
          },
        },
        ...lastMessageDateCondition, // Filtrer par le dernier message ou la date de création
      },
      include: getChatChannelDataInclude(),
      take: pageSize + 1, // Récupérer une page supplémentaire pour déterminer s'il y a une page suivante
    });

    // Trie les canaux par la date du dernier message (ou la date de création du canal s'il n'y a pas de message)
    channels.sort((a, b) => {
      const lastMessageA = a.messages[0]?.createdAt || a.createdAt;
      const lastMessageB = b.messages[0]?.createdAt || b.createdAt;
      return new Date(lastMessageB).getTime() - new Date(lastMessageA).getTime();
    });

    // Récupérer également les messages envoyés à soi-même sans canal
    const selfMessage: MessageData | null = await prisma.message.findFirst({
      where: {
        senderId: user.id,
        type: "SAVED",  // Type de message sauvegardé
      },
      include: getMessageDataInclude(),
      orderBy: { createdAt: 'desc' },
    });

    // Ajouter les messages envoyés à soi-même aux canaux
    if (selfMessage) {
      if (selfMessage.content !== `create-${user.id}`) {
        selfMessage.type = "CONTENT"
      }
      const selfChannel: ChannelData | null = {
        id: `saved-${user.id}`,
        name: null,
        privilege: "MANAGE",
        members: [
          {
            user,
            userId: user.id,
            type: "OWNER"
          },
        ],
        maxMembers: 1,
        messages: [selfMessage],
        isGroup: false,
        createdAt: selfMessage.createdAt,
      };
      if (selfChannel) {
        channels.unshift(selfChannel);  // Ajouter ce canal fictif au début de la liste
      }
    }

    const nextCursor = channels.length > pageSize ? channels[pageSize].id : null;

    const data: ChannelsSection = {
      channels: channels.slice(0, pageSize),
      nextCursor,
    };

    return Response.json(data);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}


export async function POST(req: Request) {
  try {
    // Validation de l'utilisateur connecté
    const { user } = await validateRequest();
    if (!user) {
      return Response.json({ error: "Action non autorisée" }, { status: 401 });
    }

    // Lecture et parsing du body de la requête
    const body = await req.json();
    const parsed = createChannelSchema.parse(body);

    // Assurer que l'utilisateur connecté est dans les membres du canal
    let members = parsed.members ? [...parsed.members, user.id] : [user.id];

    // Supprimer les doublons dans la liste des membres
    members = [...new Set(members)];

    // Validation pour les groupes : au moins deux membres (l'utilisateur connecté + 1 autre)
    if (parsed.isGroup && members.length < 2) {
      return Response.json(
        { error: "Un groupe doit avoir au moins deux membres" },
        { status: 400 }
      );
    }

    // Vérifier si une discussion individuelle (non groupe) avec ces deux membres existe déjà
    if (!parsed.isGroup) {
      const existingChannel = await prisma.channel.findFirst({
        where: {
          isGroup: false,
          AND: [
            { members: { some: { userId: members[0] } } },
            { members: { some: { userId: members[1] } } }
          ],
        },
        include: getChatChannelDataInclude(),
      });

      // Si un canal existe déjà, le renvoyer directement
      if (existingChannel) {
        return Response.json(existingChannel);
      }
    }

    // Si le canal n'existe pas, le créer
    const channel = await prisma.channel.create({
      data: {
        name: parsed.name,
        isGroup: parsed.isGroup,
        members: {
          create: members.map((memberId) => ({
            userId: memberId,
          })),
        },
      },
      include: getChatChannelDataInclude(), // Inclure les données requises
    });

    await prisma.message.create({
      data: {
        content: "created",
        channelId: channel.id,
        senderId: (channel.isGroup ? user.id : null),
        type: "CREATE"
      },
    });

    return Response.json(channel);
  } catch (error) {
    console.error("Erreur lors de la création de la discussion:", error);
    return Response.json(
      { error: "Impossible de créer cette discussion" },
      { status: 400 }
    );
  }
}

