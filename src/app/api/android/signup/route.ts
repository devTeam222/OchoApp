// api/android/signup/route.ts

import { lucia } from "@/auth";
import prisma from "@/lib/prisma";
import { signupSchema, SignupValues } from "@/lib/validation";
import { hash } from "@node-rs/argon2";
import { generateIdFromEntropySize } from "lucia";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json(); // Récupérer et parser le corps de la requête
    const credentials: SignupValues = signupSchema.parse(body);
    const { username, email, password } = signupSchema.parse(credentials);

    const passwordHash = await hash(password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    const userId = generateIdFromEntropySize(10);

    const existingUsername = await prisma.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: "insensitive",
        },
      },
    });

    if (existingUsername) {
      return NextResponse.json(
        {
          success: false,
          message: "Ce nom d'utilisateur est déjà pris",
          name: "username",
        },
        { status: 200 },
      );
    }

    const existingEmail = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
    });

    if (existingEmail) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cette adresse email est déjà enregistrée. Voulez-vous vous connecter ?",
          name: "email",
        },
        { status: 200 },
      );
    }

    const user = await prisma.user.create({
      data: {
        id: userId,
        username,
        displayName: username,
        email,
        passwordHash,
      },
    });

    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );

    return NextResponse.json(
      {
        success: true,
        message: "Inscription réussie",
        data: {
          user,
          session,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        success: false,
        message: "Quelque chose s'est mal passé. Veuillez réessayer.",
      },
      { status: 200 },
    );
  }
}
