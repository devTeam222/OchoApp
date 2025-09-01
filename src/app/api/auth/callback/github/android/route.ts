import { github, lucia } from "@/auth";
import kyInstance from "@/lib/ky";
import prisma from "@/lib/prisma";
import { generateId } from "lucia";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  const storedState = cookies().get("state")?.value;

  if (!code || !state || !storedState || state !== storedState) {
    console.log(code, state, storedState);

    return new Response(null, { status: 400 });
  }

  try {
    const tokens = await github.validateAuthorizationCode(code);

    const githubUser = await kyInstance
      .get("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      })
      .json<{ id: string; login: string; avatar_url: string }>();

    const githubId = githubUser.id.toString();
    const githubUsername = githubUser.login.toString();
    const githubAvatarUrl = githubUser.avatar_url;

    const existingUser = await prisma.user.findUnique({
      where: { githubId },
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

    const authCode = generateId(20)
    await prisma.authCode.create({
      data: {
        id: authCode,
        userId: githubId,
        expiresAt: new Date(Date.now() + 600_000)
      }
    })

    if (existingUser) {
      const session = await lucia.createSession(existingUser.id, {});
      const sessionCookie = lucia.createSessionCookie(session.id);

      cookies().set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes,
      );

      return new Response(null, {
        status: 302,
         headers: {
          Location: `/redirect?provider=github&userId=${githubId}&code=${authCode}`,
        },
      });
    }
    return new Response(null, {
        status: 302,
         headers: {
          Location: `/redirect?provider=github&userId=${githubId}&code=${authCode}`,
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
