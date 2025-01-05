import { lucia } from "@/auth";
import kyInstance from "@/lib/ky";
import prisma from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { generateIdFromEntropySize } from "lucia";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { User, ApiResponse, UserSession } from "../../utils/dTypes";

export async function POST(req: NextRequest) {
  const token = await req.text();

  if (!token) {
    return NextResponse.json({
      success: false,
      message: "Quelque chose s'est mal passé. Veuillez réessayer.",
    });
  }

  try {
    const googleUser = await kyInstance
      .get("https://www.googleapis.com/oauth2/v1/userinfo/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .json<{ id: string; name: string }>();

    const existingUser = await prisma.user.findUnique({
      where: { googleId: googleUser.id },
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

    if (existingUser) {
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
    }

    const userId = generateIdFromEntropySize(10);

    async function validatedUsername() {
      const baseUsername = slugify(googleUser.name);
      let validatedUsername = baseUsername;

      // Chercher tous les noms d'utilisateur qui commencent par le nom de base
      const similarUsernames = await prisma.user.findMany({
        where: {
          username: {
            startsWith: baseUsername,
          },
        },
        select: { username: true },
      });

      if (similarUsernames.length === 0) {
        // Si aucun nom d'utilisateur similaire, le nom est disponible
        return validatedUsername;
      }

      // Extraire uniquement les suffixes numériques
      const usernameSet = new Set(similarUsernames.map((u) => u.username));
      let number = 1;

      // Trouver le premier suffixe disponible
      while (usernameSet.has(validatedUsername)) {
        validatedUsername = `${baseUsername}${number}`;
        number++;
      }

      return validatedUsername;
    }

    const username = await validatedUsername();

    const userData = await prisma.user.create({
      data: {
        id: userId,
        username,
        displayName: googleUser.name,
        googleId: googleUser.id,
      },
    });

    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );

    const user = {
      id: userData.id,
      username: userData.username,
      displayName: userData.displayName,
      email: userData.email,
      avatarUrl: userData.avatarUrl,
      bio: userData.bio,
      createdAt: userData.createdAt.getTime(),
      lastSeen: userData.lastSeen.getTime(),
      verified: {
        verified: false,
        type: null,
        expiresAt: null,
      },
    };

    return NextResponse.json({
      success: true,
      message: "Inscription réussie",
      data: {
        user,
        session,
      },
    } as ApiResponse<UserSession>);
  } catch (error) {
    console.error(error);
    return NextResponse.json({
      success: false,
      message: "Quelque chose s'est mal passé. Veuillez réessayer.",
    });
  }
}
