"use server"

import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { ChannelData, getChatChannelDataInclude, getMessageDataInclude, getUserDataSelect, MessageData, UserData } from "@/lib/types";
import { addMemberSchema, createChannelSchema, createMessageSchema } from "@/lib/validation";

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
      include: getMessageDataInclude(),
    });

    newMessage.type = "CONTENT"

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
      include: getMessageDataInclude(),
    }),
    prisma.channel.findFirst({
      where: {
        id: channelId,
      },
      include: getChatChannelDataInclude(),
    }),
  ]);

  return { newMessage, channelId, userId, newChannel };
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

  (!members?.includes(userId) || members.length === 1) && members?.unshift(userId);

  if (!members?.length) {
    throw new Error("Selectionnez au moins un utilisateur")
  }
  if (isGroup && members?.length < 2) {
    throw new Error("Un groupe doit avoir au moins deux membres")
  }
  if (!isGroup) {
    const existingChannel: ChannelData | null = await prisma.channel.findFirst({
      where: {
        isGroup: false,
        AND: [
          { members: { some: { userId: members[0] } } },
          { members: { some: { userId: members[1] } } }
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
          type: (isGroup && memberId === userId) ? "OWNER" : "MEMBER",
        })),
      },
    },
    include: getChatChannelDataInclude(), // Inclure les données requises
  });

  await prisma.message.create({
    data: {
      content: "created",
      channelId: newChannel.id,
      senderId: (newChannel.isGroup ? user.id : null),
      type: "CREATE"
    },
    include: getMessageDataInclude(),
  });

  const newMembers: (string)[] = newChannel.members.map(member => {
    return member.userId
  }).filter(
    (memberId) => memberId !== userId
  ).filter(
    member => member !== null
  )
  if (newMembers && newMembers.length) {
    newMembers.map(async (memberId) => {
      const member = await prisma.channelMember.findUnique({
        where: {
          channelId_userId: {
            channelId: newChannel.id,
            userId: memberId
          }
        },
        select: {
          user: { select: getUserDataSelect(memberId) }
        }
      });
      if (!member?.user) {
        return
      }
      const message = await prisma.message.create({
        data: {
          content: "add-" + member.user.id,
          senderId: userId,
          recipientId: member.user.id,
          type: "NEWMEMBER",
          channelId: newChannel.id,
        },
        include: getMessageDataInclude()
      });
      return message;
    });

  }

  const createInfo: MessageData = await prisma.message.findFirst({
    where: {
      channelId: newChannel.id,
    },
    include: getMessageDataInclude(),
    orderBy: {
      createdAt: 'desc',
    },
    take: 1,
  }) as MessageData
  
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
    throw new Error("Selectionnez au moins un utilisateur")
  }
  const channel = await prisma.channel.findUnique({
    where: {
      id: channelId
    }
  })
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
      channelId
    }
  });
  if (existingMembers.length >= channel.maxMembers) {
    throw new Error("Ce groupe est plein");
  }

  const newMembers = members.filter(memberId =>
    !existingMembers.some(existingMember => existingMember.userId === memberId)
  );

  const newMembersIds = newMembers.map(memberId => ({
    userId: memberId, channelId: channelId
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
          userId: memberId
        }
      },
      select: {
        user: { select: getUserDataSelect(memberId) }
      }
    });
    if (!member?.user) {
      return
    }
    const message = await prisma.message.create({
      data: {
        content: "add-" + member.user.id,
        senderId: userId,
        recipientId: member.user.id,
        type: "NEWMEMBER",
        channelId,
      },
      include: getMessageDataInclude()
    });
    return message;
  });


  const lastMessage: MessageData | null = await prisma.message.findFirst({
    where: {
      channelId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 1,
    include: getMessageDataInclude()
  });

  // Fetch only new added members userdata
  const newMembersList = (await Promise.all(newMembers.map(async (memberId) => {
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
          select: getUserDataSelect(memberId)
        }
      },
    });

    if (!member) {
      return undefined; // Explicitly return undefined
    }

    return member;
  }))).filter((member) => member !== undefined);


  return { newMembersList, userId, channelId, sentInfoMessages, lastMessage };

}
export async function saveMessage() {

  const { user: loggedInUser } = await validateRequest();

  if (!loggedInUser) {
    throw new Error("Action non autorisée")
  }

  const user = await prisma.user.findFirst({
    where: {
      id: loggedInUser.id,
    },
    select: getUserDataSelect(loggedInUser.id)
  });

  if (!user) {
    throw new Error("Action non autorisée")
  }

  const userId = user.id;



  const existingSavedMsgs = await prisma.message.findMany({
    where: {
      senderId: {
        equals: userId,
      },
      type: {
        equals: "SAVED",
      }
    },
    include: getMessageDataInclude(),
    take: 1,
    orderBy: { createdAt: 'desc' },
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
        }
      },
      include: getMessageDataInclude(),
      take: 1,
      orderBy: { createdAt: 'asc' },
    });

    const newChannel: ChannelData = {
      id: `saved-${userId}`,
      name: null,
      privilege: "MANAGE",
      members: [
        {
          user: {
            ...user,
            bio: "",
            createdAt: new Date(),
          },
          userId,
          type: "OWNER"
        },
      ],
      maxMembers: 300,
      messages: [
        existingSavedMsg
      ],
      isGroup: false,
      createdAt: createInfo?.createdAt || new Date(),
    }
    return { newChannel, userId };
  }

  const createInfo: MessageData = await prisma.message.create({
    data: {
      content: `create-${user.id}`,
      senderId: userId,
      type: "SAVED"
    },
    include: getMessageDataInclude(),
  });

  const newMessage: MessageData = {
    id: createInfo.id,
    content: createInfo.content,
    senderId: userId,
    sender: createInfo.sender,
    recipientId: userId,
    recipient: user,
    type: "CREATE",
    channelId: userId,
    createdAt: createInfo.createdAt
  }

  const newChannel: ChannelData = {
    id: `saved-${userId}`,
    name: null,
    privilege: "MANAGE",
    members: [
      {
        user: {
          ...user,
          bio: null,
          createdAt: new Date(),
        },
        userId,
        type: "OWNER"
      },
    ],
    maxMembers: 300,
    messages: [
      newMessage
    ],
    isGroup: false,
    createdAt: createInfo.createdAt,
  }

  if (!createInfo) {
    throw new Error("Impossible de créer le message de création du canal");
  }
  return { newChannel, userId, createInfo: newMessage };
}
