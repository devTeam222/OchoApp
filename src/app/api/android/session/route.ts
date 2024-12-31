import prisma from "@/lib/prisma";
import { sessionSchema, LoginValues, SessionValues } from "@/lib/validation";
import { verify } from "@node-rs/argon2";
import { lucia } from "@/auth";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json(); // Récupérer et parser le corps de la requête
    const sessionCredentials: SessionValues = sessionSchema.parse(body);
    const { id, userId } = sessionCredentials;

    const existingUser = await prisma.user.findFirst({
      where: {
        id: {
          equals: userId,
          mode: "insensitive",
        },
      },
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
        message:
          "Session non valide. Veuillez vous reconnecter et réessayer",
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
      message: "Session validée avec succès.",
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
