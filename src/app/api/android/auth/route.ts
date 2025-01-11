import { lucia } from "@/auth";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { User, ApiResponse, UserSession } from "../utils/dTypes";

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type");
  const user_id = req.nextUrl.searchParams.get("userId") || "";
  const code = req.nextUrl.searchParams.get("code") || "";

  const authCode = await prisma.authCode.findUnique({
    where: {
      id_userId: {
        id: code,
        userId: user_id,
      },
    },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
    },
  });

  if (!authCode) {
    return NextResponse.json({
      success: false,
      message: "Code d'authentification expiré ou invalide.",
    });
  }
  const isExpired = new Date() > new Date(authCode.expiresAt);
  await prisma.authCode.delete({
    where: {
      id_userId: {
        id: code,
        userId: user_id,
      },
    },
  });

  if (isExpired) {
    return NextResponse.json({
      success: false,
      message: "Code d'authentification expiré ou invalide.",
    });
  }


  try {
    const wheres = {
      google: {
        where: { googleId: user_id },
      },
      github: {
        where: { githubId: user_id },
      },
    };

    const where = wheres[type as keyof typeof wheres].where;

    const existingUser = await prisma.user.findUnique({
      where,
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        email: true,
        bio: true,
        createdAt: true,
        lastSeen: true,
        verified: {
          select: {
            type: true,
            expiresAt: true,
          },
        },
        passwordHash: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json({
        success: false,
        message: "Compte introuvable.",
      });
    }
    const userData = existingUser;
    const session = await lucia.createSession(existingUser.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );
    const user: User = {
      id: userData.id,
      username: userData.username,
      displayName: userData.displayName,
      email: userData.email || undefined,
      avatarUrl: userData.avatarUrl || undefined,
      bio: userData.bio || undefined,
      createdAt: userData.createdAt.getTime(),
      lastSeen: userData.lastSeen.getTime(),
      verified: {
        verified: !!userData.verified?.[0],
        type: userData.verified?.[0]?.type,
        expiresAt: userData.verified?.[0]?.expiresAt,
      },
    };

    return NextResponse.json<ApiResponse<UserSession>>({
      success: true,
      message: "Connexion réussie",
      data: {
        user,
        session,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({
      success: false,
      message: "Quelque chose s'est mal passé. Veuillez réessayer.",
    });
  }
}
