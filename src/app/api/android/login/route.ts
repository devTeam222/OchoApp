import prisma from "@/lib/prisma";
import { loginSchema, LoginValues } from "@/lib/validation";
import { verify } from "@node-rs/argon2";
import { lucia } from "@/auth";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { ApiResponse, LoginResponse, User, UserSession } from "../utils/dTypes";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json(); // Récupérer et parser le corps de la requête
    const credentials: LoginValues = loginSchema.parse(body);
    const { username, password } = credentials;

    const existingUser = await prisma.user.findFirst({
      where: {
        username: {
          equals: username,
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

    if (!existingUser || !existingUser.passwordHash) {
      return NextResponse.json({
        success: false,
        message:
          "Nom d'utilisateur ou mot de passe incorrect. Verifiez vos informations",
      });
    }

    const validPassword = await verify(existingUser.passwordHash, password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    if (!validPassword) {
      return NextResponse.json({
        success: false,
        message:
          "Nom d'utilisateur ou mot de passe incorrect. Verifiez vos informations",
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
