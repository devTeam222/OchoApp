"use server";

import Message from "@/app/(main)/messages/Message";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import {
  ChannelData,
  getChatChannelDataInclude,
  getMessageDataInclude,
  getUserDataSelect,
  MessageData,
  UserData,
} from "@/lib/types";
import {
  addAdminSchema,
  addMemberSchema,
  createChannelSchema,
  createMessageSchema,
  memberActionSchema,
} from "@/lib/validation";

export async function submitMessage(input: {
  content: string;
  channelId: string;
}) {
  const { user } = await validateRequest();

  if (!user) {
    throw new Error("Action non autorisée");
  }

  const userId = user.id;
  const { content, channelId } = createMessageSchema.parse(input);

  // Vérifier si le message est envoyé à soi-même (message sauvegardé)
  const isSavedMessage = channelId === `saved-${userId}`;

  if (isSavedMessage) {
    // Créer uniquement le message sans canal
    const newMessage = await prisma.message.create({
      data: {
        content,
        senderId: user.id,
        type: "SAVED",
      },
      include: getMessageDataInclude(userId),
    });

    const messageId = newMessage.id;
    await prisma.read.upsert({
      where: {
        userId_messageId: {
          userId,
          messageId,
        },
      }, 
     create: {
      userId,
      messageId,
     },
     update: {}
    });

    newMessage.type = "CONTENT";

    return { newMessage, channelId, userId, newChannel: null }; // Pas de nouveau canal
  }

  // Si ce n'est pas un message sauvegardé, créer un message et vérifier le canal
  const [newMessage, newChannel] = await prisma.$transaction([
    prisma.message.create({
      data: {
        content,
        channelId: channelId,
        senderId: user.id,
        type: "CONTENT",
      },
      include: getMessageDataInclude(userId),
    }),
    prisma.channel.findFirst({
      where: {
        id: channelId,
      },
      include: getChatChannelDataInclude(),
    }),
  ]);

  const messageId = newMessage.id;
  await prisma.read.upsert({
    where: {
      userId_messageId: {
        userId,
        messageId,
      },
    }, 
   create: {
    userId,
    messageId,
   },
   update: {}
  });

  return { newMessage, channelId, userId, newChannel };
}

export async function deleteMessage(id: string) {
  const { user } = await validateRequest();

  if (!user) {
      throw new Error("Action non autorisée");
  }

  const message = await prisma.message.findUnique({
      where: { id }
  })
  if (!message) {
      throw new Error("Commentaire non trouve");
  }
  if (message.senderId !== user.id) {
      throw new Error("Action non autorisée");
  }

  const deletedMessage = await prisma.message.delete({
      where: { id },
      include: getMessageDataInclude(user.id)
  });

  return deletedMessage
}

export async function createChatChannel(input: {
  name: string | null;
  isGroup: boolean;
  members: string[];
}) {
  const { user } = await validateRequest();

  if (!user) {
    throw new Error("Action non autorisée");
  }

  const userId = user.id;

  const { name, isGroup, members } = createChannelSchema.parse(input);

  (!members?.includes(userId) || members.length === 1) &&
    members?.unshift(userId);

  if (!members?.length) {
    throw new Error("Selectionnez au moins un utilisateur");
  }
  if (isGroup && members?.length < 2) {
    throw new Error("Un groupe doit avoir au moins deux membres");
  }
  if (!isGroup) {
    const existingChannel: ChannelData | null = await prisma.channel.findFirst({
      where: {
        isGroup: false,
        AND: [
          { members: { some: { userId: members[0] } } },
          { members: { some: { userId: members[1] } } },
        ],
      },
      include: getChatChannelDataInclude(),
    });
    if (existingChannel) {
      return { newChannel: existingChannel, userId };
    }
  }
  // Si le canal n'existe pas, le créer
  const newChannel: ChannelData = await prisma.channel.create({
    data: {
      name: name?.trim() || null,
      isGroup: isGroup,
      members: {
        create: members.map((memberId) => ({
          userId: memberId,
          type: isGroup && memberId === userId ? "OWNER" : "MEMBER",
        })),
      },
    },
    include: getChatChannelDataInclude(), // Inclure les données requises
  });

  const createMessage = await prisma.message.create({
    data: {
      content: "created",
      channelId: newChannel.id,
      senderId: newChannel.isGroup ? user.id : null,
      type: "CREATE",
    },
    include: getMessageDataInclude(user.id),
  });

  const newMembers: string[] = newChannel.members
    .map((member) => {
      return member.userId;
    })
    .filter((memberId) => memberId !== userId)
    .filter((member) => member !== null);
  if (newMembers && newMembers.length) {
    newMembers.map(async (memberId) => {
      const member = await prisma.channelMember.findUnique({
        where: {
          channelId_userId: {
            channelId: newChannel.id,
            userId: memberId,
          },
        },
        select: {
          user: { select: getUserDataSelect(memberId) },
        },
      });
      if (!member?.user) {
        return;
      }
      if(!newChannel.isGroup){
        return createMessage;
      } 
      const message = await prisma.message.create({
        data: {
          content: "add-" + member.user.id,
          senderId: userId,
          recipientId: member.user.id,
          type: "NEWMEMBER",
          channelId: newChannel.id,
        },
        include: getMessageDataInclude(user.id),
      });
      return message;
    });
  }

  const createInfo: MessageData = (await prisma.message.findFirst({
    where: {
      channelId: newChannel.id,
    },
    include: getMessageDataInclude(user.id),
    orderBy: {
      createdAt: "desc",
    },
    take: 1,
  })) as MessageData;

  return { newChannel, userId, createInfo };
}
export async function addMembers(input: {
  channelId: string;
  members: string[];
}) {
  const { user } = await validateRequest();

  if (!user) {
    throw new Error("Action non autorisée");
  }

  const userId = user.id;

  const { channelId, members } = addMemberSchema.parse(input);

  if (!members?.length) {
    throw new Error("Selectionnez au moins un utilisateur");
  }
  const channel = await prisma.channel.findUnique({
    where: {
      id: channelId,
    },
  });
  if (!channel) {
    throw new Error("La discussion n'existe pas");
  }
  if (!channel.isGroup) {
    throw new Error("Cette discussion n'est pas un groupe");
  }
  if (members.includes(userId)) {
    throw new Error("Vous êtes déjà membre de ce groupe");
  }
  const existingMembers = await prisma.channelMember.findMany({
    where: {
      channelId,
    },
  });
  if (existingMembers.length >= channel.maxMembers) {
    throw new Error("Ce groupe est plein");
  }

  const newMembers = members.filter(
    (memberId) =>
      !existingMembers.some(
        (existingMember) => existingMember.userId === memberId,
      ),
  );

  const newMembersIds = newMembers.map((memberId) => ({
    userId: memberId,
    channelId: channelId,
  }));
  const newMembersCreated = await prisma.channelMember.createMany({
    data: newMembersIds,
  });

  if (!newMembersCreated) {
    throw new Error("Erreur lors de l'ajout des membres");
  }
  // Send info message for each created new member
  const sentInfoMessages = newMembers.map(async (memberId) => {
    const member = await prisma.channelMember.findUnique({
      where: {
        channelId_userId: {
          channelId,
          userId: memberId,
        },
      },
      select: {
        user: { select: getUserDataSelect(memberId) },
      },
    });
    if (!member?.user) {
      return;
    }
    const message = await prisma.message.create({
      data: {
        content: "add-" + member.user.id,
        senderId: userId,
        recipientId: member.user.id,
        type: "NEWMEMBER",
        channelId,
      },
      include: getMessageDataInclude(user.id),
    });
    return message;
  });

  const lastMessage: MessageData | null = await prisma.message.findFirst({
    where: {
      channelId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 1,
    include: getMessageDataInclude(user.id),
  });

  // Fetch only new added members userdata
  const newMembersList = (
    await Promise.all(
      newMembers.map(async (memberId) => {
        const member = await prisma.channelMember.findUnique({
          where: {
            channelId_userId: {
              userId: memberId,
              channelId: channelId,
            },
          },
          select: {
            userId: true,
            user: {
              select: getUserDataSelect(memberId),
            },
          },
        });

        if (!member) {
          return undefined; // Explicitly return undefined
        }

        return member;
      }),
    )
  ).filter((member) => member !== undefined);

  return { newMembersList, userId, channelId, sentInfoMessages, lastMessage };
}
export async function addAdmin(input: { channelId: string; member: string }) {
  const { user } = await validateRequest();

  if (!user) {
    throw new Error("Action non autorisée");
  }

  const { channelId, member } = addAdminSchema.parse(input);

  const userId = member;

  // Check if the user exist
  const userExist = await prisma.user.findUnique({
    where: {
      id: member,
    },
  });

  // throw error if user is not found
  if (!userExist) {
    throw new Error("Utilisateur non trouvé");
  }

  const channel = await prisma.channel.findUnique({
    where: {
      id: channelId,
    },
  });

  if (!channel) {
    throw new Error("La discussion n'existe pas");
  }

  if (!channel.isGroup) {
    throw new Error("Cette discussion n'est pas un groupe");
  }

  // check if the user is member of the channel
  const channelMember = await prisma.channelMember.findUnique({
    where: {
      channelId_userId: {
        channelId,
        userId,
      },
    },
  });
  // throw an error if user is not a member
  if (!channelMember) {
    throw new Error("L'utilisateur n'est plus membre de cette discussion");
  }

  // check if member type is not OLD or BANNED
  if (channelMember.type === "OLD" || channelMember.type === "BANNED") {
    throw new Error(
      "Cet utilisateur ne fais plus parti de cette discussion ou e été banni",
    );
  }
  // name admin by changing the type between ADMIN & MEMBER
  const newChannelMember = await prisma.channelMember.update({
    where: {
      channelId_userId: {
        channelId,
        userId,
      },
    },
    data: {
      type: channelMember.type === "ADMIN" ? "MEMBER" : "ADMIN",
    },
  });

  return { newChannelMember };
}
export async function removeMember(input: {
  channelId: string;
  memberId: string;
}) {
  const { user } = await validateRequest();

  if (!user) {
    throw new Error("Action non autorisée");
  }

  const { channelId, memberId } = memberActionSchema.parse(input);

  const userId = memberId || "";

  // Check if the user exist
  const userExist = await prisma.user.findUnique({
    where: {
      id: memberId,
    },
  });

  // throw error if user is not found
  if (!userExist) {
    throw new Error("Utilisateur non trouvé");
  }

  const channel = await prisma.channel.findUnique({
    where: {
      id: channelId,
    },
  });

  if (!channel) {
    throw new Error("La discussion n'existe pas");
  }

  if (!channel.isGroup) {
    throw new Error("Cette discussion n'est pas un groupe");
  }

  // check if the user is member of the channel
  const channelMember = await prisma.channelMember.findUnique({
    where: {
      channelId_userId: {
        channelId,
        userId,
      },
    },
  });
  // throw an error if user is not a member
  if (!channelMember) {
    throw new Error("L'utilisateur n'est plus membre de cette discussion");
  }

  // check if member type is not OLD or BANNED
  if (channelMember.type === "OLD" || channelMember.type === "BANNED") {
    throw new Error(
      "Cet utilisateur ne fais plus parti de cette discussion ou e été banni",
    );
  }
  // name admin by changing the type between ADMIN & MEMBER
  const oldMember = await prisma.channelMember.update({
    where: {
      channelId_userId: {
        channelId,
        userId,
      },
    },
    data: {
      type: "OLD",
      leftAt: new Date(),
    },
  });
  if (!oldMember) {
    throw new Error("Erreur lors de la suppression du membre");
  }
  // Send a message
  const removeMsg = await prisma.message.create({
    data: {
      content: "leave",
      channelId,
      type: "LEAVE",
      senderId: user.id,
      recipientId: memberId,
    },
  });
  if (!removeMsg) {
    throw new Error("Erreur lors de la suppression du membre");
  }
}
export async function banMember(input: {
  channelId: string;
  memberId: string;
}) {
  const { user } = await validateRequest();

  if (!user) {
    throw new Error("Action non autorisée");
  }

  const { channelId, memberId } = memberActionSchema.parse(input);

  const userId = memberId || "";

  // Check if the user exist
  const userExist = await prisma.user.findUnique({
    where: {
      id: memberId,
    },
  });

  // throw error if user is not found
  if (!userExist) {
    throw new Error("Utilisateur non trouvé");
  }

  const channel = await prisma.channel.findUnique({
    where: {
      id: channelId,
    },
  });

  if (!channel) {
    throw new Error("La discussion n'existe pas");
  }

  if (!channel.isGroup) {
    throw new Error("Cette discussion n'est pas un groupe");
  }

  // check if the user is member of the channel
  const channelMember = await prisma.channelMember.findUnique({
    where: {
      channelId_userId: {
        channelId,
        userId,
      },
    },
  });
  // throw an error if user is not a member
  if (!channelMember) {
    throw new Error("L'utilisateur n'est plus membre de cette discussion");
  }

  // check if member type is not OLD or BANNED
  if (channelMember.type === "OLD" || channelMember.type === "BANNED") {
    throw new Error(
      "Cet utilisateur ne fais plus parti de cette discussion ou e été banni",
    );
  }
  // ban the member
  const bannedMember = await prisma.channelMember.update({
    where: {
      channelId_userId: {
        channelId,
        userId,
      },
    },
    data: {
      type: "BANNED",
      leftAt: new Date(),
    },
  });
  if (!bannedMember) {
    throw new Error("L'utilisateur n'a pas été banni");
  }
  // Send a message
  const banMsg = await prisma.message.create({
    data: {
      content: "ban",
      channelId,
      type: "BAN",
      senderId: user.id,
      recipientId: memberId,
    },
  });

  if (!banMsg) {
    throw new Error("Le message de bannissement n'a pas été envoyé");
  }
}

export async function leaveGroup(input: {
  channelId: string;
  deleteGroup: boolean;
}) {
  const { user } = await validateRequest();

  if (!user) {
    throw new Error("Action non autorisée");
  }

  const { channelId, deleteGroup } = memberActionSchema.parse(input);
  const userId = user.id;

  // Vérifier si le canal existe et que c'est bien un groupe
  const channel = await prisma.channel.findUnique({
    where: {
      id: channelId,
    },
    include: {
      members: true, // Inclure les membres du canal pour vérifier le statut
    },
  });

  if (!channel) {
    throw new Error("Le groupe n'existe pas");
  }

  if (!channel.isGroup) {
    throw new Error("Cette discussion n'est pas un groupe");
  }

  // Vérifier si l'utilisateur est membre du groupe
  const channelMember = await prisma.channelMember.findUnique({
    where: {
      channelId_userId: {
        channelId,
        userId,
      },
    },
  });

  if (!channelMember) {
    throw new Error("Vous n'êtes plus membre de ce groupe");
  }

  // Si l'utilisateur est le propriétaire du groupe
  if (channelMember.type === "OWNER") {
    // Vérifier combien de membres sont encore dans le groupe
    const remainingMembers = channel.members.filter(
      (member) => member.type !== "OLD" && member.type !== "BANNED",
    );

    // Si l'utilisateur est le seul membre restant
    if (remainingMembers.length === 1) {
      // Supprimer le groupe automatiquement
      await prisma.channel.delete({
        where: {
          id: channelId,
        },
      });
      return {
        message:
          "Le groupe a été supprimé car il n'y avait plus qu'un seul membre.",
      };
    }

    if (deleteGroup) {
      // Supprimer le groupe si l'utilisateur choisit cette option
      await prisma.channel.delete({
        where: {
          id: channelId,
        },
      });
      return { message: "Le groupe a été supprimé avec succès." };
    } else {
      // Nommer le membre le plus ancien comme propriétaire
      const nextOwner = remainingMembers
        .filter((member) => member.userId !== userId)
        .sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime())[0];

      if (!nextOwner) {
        throw new Error("Aucun autre membre à nommer comme propriétaire.");
      }

      // Mettre à jour le type du nouveau propriétaire
      await prisma.channelMember.update({
        where: {
          channelId_userId: {
            channelId,
            userId: nextOwner.userId as string,
          },
        },
        data: {
          type: "OWNER",
        },
      });
    }
  }

  // Mettre à jour l'utilisateur pour indiquer qu'il a quitté le groupe
  await prisma.channelMember.update({
    where: {
      channelId_userId: {
        channelId,
        userId,
      },
    },
    data: {
      type: "OLD",
      leftAt: new Date(),
    },
  });

  // Envoyer un message dans le groupe pour notifier le départ
  await prisma.message.create({
    data: {
      content: "leave",
      channelId,
      type: "LEAVE",
      recipientId: userId,
    },
  });

  return { message: "Vous avez quitté le groupe avec succès." };
}

export async function restoreMember(input: {
  channelId: string;
  memberId: string;
}) {
  const { user } = await validateRequest();

  if (!user) {
    throw new Error("Action non autorisée");
  }

  const { channelId, memberId } = memberActionSchema.parse(input);

  const userId = memberId || "";

  // Check if the user exist
  const userExist = await prisma.user.findUnique({
    where: {
      id: memberId,
    },
  });

  // throw error if user is not found
  if (!userExist) {
    throw new Error("Utilisateur non trouvé");
  }

  const channel = await prisma.channel.findUnique({
    where: {
      id: channelId,
    },
  });

  if (!channel) {
    throw new Error("La discussion n'existe pas");
  }

  if (!channel.isGroup) {
    throw new Error("Cette discussion n'est pas un groupe");
  }

  // check if the user is member of the channel
  const channelMember = await prisma.channelMember.findUnique({
    where: {
      channelId_userId: {
        channelId,
        userId,
      },
    },
  });
  // throw an error if user is not a member
  if (!channelMember) {
    throw new Error("L'utilisateur n'est plus membre de cette discussion");
  }

  // Restore member
  const newChannelMember = await prisma.channelMember.update({
    where: {
      channelId_userId: {
        channelId,
        userId,
      },
    },
    data: {
      type: "MEMBER",
      leftAt: null,
    },
  });
  if (!newChannelMember) {
    throw new Error("Erreur lors de la mise à jour du membre");
  }
  await prisma.message.create({
    data: {
      content: "add-" + userId,
      senderId: user.id,
      recipientId: userId,
      type: "NEWMEMBER",
      channelId,
    },
    include: getMessageDataInclude(user.id),
  });
}
export async function saveMessage(input: {}) {
  const { user: loggedInUser } = await validateRequest();

  if (!loggedInUser) {
    throw new Error("Action non autorisée");
  }

  const user = await prisma.user.findFirst({
    where: {
      id: loggedInUser.id,
    },
    select: getUserDataSelect(loggedInUser.id),
  });

  if (!user) {
    throw new Error("Action non autorisée");
  }

  const userId = user.id;

  const existingSavedMsgs = await prisma.message.findMany({
    where: {
      senderId: {
        equals: userId,
      },
      type: {
        equals: "SAVED",
      },
    },
    include: getMessageDataInclude(user.id),
    take: 1,
    orderBy: { createdAt: "desc" },
  });
  if (existingSavedMsgs[0]) {
    const existingSavedMsg: MessageData = existingSavedMsgs[0];
    const createInfo = await prisma.message.findFirst({
      where: {
        senderId: {
          equals: userId,
        },
        type: {
          equals: "SAVED",
        },
      },
      include: getMessageDataInclude(user.id),
      take: 1,
      orderBy: { createdAt: "asc" },
    });

    const newChannel: ChannelData = {
      id: `saved-${userId}`,
      name: null,
      description: null,
      groupAvatarUrl: null,
      privilege: "MANAGE",
      members: [
        {
          user,
          userId,
          type: "OWNER",
          joinedAt: loggedInUser.createdAt,
          leftAt: null,
        },
      ],
      maxMembers: 300,
      messages: [existingSavedMsg],
      isGroup: false,
      createdAt: createInfo?.createdAt || new Date(),
    };
    return { newChannel, userId };
  }

  const createInfo: MessageData = await prisma.message.create({
    data: {
      content: `create-${user.id}`,
      senderId: userId,
      type: "SAVED",
    },
    include: getMessageDataInclude(user.id),
  });

  const newMessage: MessageData = {
    id: createInfo.id,
    content: createInfo.content,
    senderId: userId,
    sender: createInfo.sender,
    recipientId: userId,
    reactionId: null,
    recipient: user,
    type: "CREATE",
    channelId: userId,
    createdAt: createInfo.createdAt,
    _count: {
      reactions: 0
    },
    reactions:[]
  };

  const newChannel: ChannelData = {
    id: `saved-${userId}`,
    name: null,
    description: null,
    groupAvatarUrl: null,
    privilege: "MANAGE",
    members: [
      {
        user,
        userId,
        type: "OWNER",
        joinedAt: loggedInUser.createdAt,
        leftAt: null,
      },
    ],
    maxMembers: 300,
    messages: [newMessage],
    isGroup: false,
    createdAt: createInfo.createdAt,
  };

  if (!createInfo) {
    throw new Error("Impossible de créer le message de création du canal");
  }
  return { newChannel, userId, createInfo: newMessage };
}
