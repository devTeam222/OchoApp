import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NotificationCountInfo } from "@/lib/types";

export async function GET(
  req: Request,
  {
    params: { channelId },
  }: {
    params: { channelId: string };
  },
) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return Response.json({ error: "Action non autorisée" }, { status: 401 });
    }

    if (channelId === `saved-${user.id}`) {
      return Response.json({
        unreadCount: 0
      });
    }

    const unreadCount = await prisma.message.count({
      where: {
        AND: {
          channelId: {
            equals: channelId,
          },
          reads: {
            none: {
              userId: user.id,
            },
          },
        },
        NOT: {
          AND: {
            type: "CREATE",
            senderId: user.id,
          }
        }
      },
    });

    const data: NotificationCountInfo = {
      unreadCount,
    };

    return Response.json(data);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
