import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getUserDataSelect, UsersPage } from "@/lib/types";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q")?.trim() || "";
    const cursor = req.nextUrl.searchParams.get("cursor") || undefined;
    const pageSize = 10;
    const channelId = req.nextUrl.searchParams.get("channelId");

    const { user } = await validateRequest();
    if (!user) {
      return Response.json({ error: "Action non autorisée" }, { status: 401 });
    }

    let users;
    let excludedUserIds: string[] = [];

    // Si un channelId est fourni, exclure les utilisateurs déjà dans le canal
    if (channelId) {
      const channelMembers = await prisma.channelMember.findMany({
        where: { channelId },
        select: { userId: true },
      });

      excludedUserIds = channelMembers.map((member) => member.userId) as string[];
    }

    // Si une requête de recherche est fournie
    if (q) {
      users = await prisma.user.findMany({
        where: {
          OR: [
            { displayName: { contains: q, mode: "insensitive" } },
            { username: { contains: q, mode: "insensitive" } },
          ],
          ...(channelId
            ? {
                id: {
                  notIn: excludedUserIds,
                },
              }
            : {}),
        },
        select: getUserDataSelect(user.id),
        orderBy: { createdAt: "desc" },
        take: pageSize + 1,
        cursor: cursor ? { id: cursor } : undefined,
      });
    } else {
      // Si aucune requête de recherche n'est fournie
      users = await prisma.user.findMany({
        where: {
          ...(channelId
            ? {
                id: {
                  notIn: excludedUserIds,
                },
              }
            : {}),
        },
        select: getUserDataSelect(user.id),
        orderBy: { createdAt: "desc" },
        take: pageSize + 1,
        cursor: cursor ? { id: cursor } : undefined,
      });
    }

    const nextCursor = users.length > pageSize ? users[pageSize]?.id : null;
    const data: UsersPage = {
      users: users.slice(0, pageSize),
      nextCursor,
    };

    return Response.json(data);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
