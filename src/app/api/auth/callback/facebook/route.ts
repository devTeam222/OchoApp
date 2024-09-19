"use server"

import { facebook, lucia } from "@/auth";
import kyInstance from "@/lib/ky";
import prisma from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { OAuth2RequestError } from "arctic";
import { generateIdFromEntropySize } from "lucia";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import fs from "fs/promises";
import sharp from "sharp";
import path from "path";

export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get("code");

    if (!code) {
        return new Response(null, { status: 400 });
    }

    try {
        const {
            accessToken,
            accessTokenExpiresAt
        } = await facebook.validateAuthorizationCode(code);

        const facebookUser = await kyInstance
            .get(`https://graph.facebook.com/me?access_token=${accessToken}&fields=id,name,picture`)
            .json<{
                id: string;
                name: string;
                email: string;
                picture: {
                    data: {
                        url: string;
                        height: number;
                        is_silhouette: boolean;
                        width: number;
                    };
                };
            }>();

        const existingUser = await prisma.user.findUnique({
            where: { facebookId: facebookUser.id },
        });

        if (existingUser) {
            const session = await lucia.createSession(existingUser.id, {});
            const sessionCookie = lucia.createSessionCookie(session.id);

            cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

            return new Response(null, {
                status: 302,
                headers: {
                    Location: "/",
                },
            });
        }

        const userId = generateIdFromEntropySize(10);

        async function validatedUsername() {
            const baseUsername = slugify(facebookUser.name);
            let validatedUsername = baseUsername;

            const similarUsernames = await prisma.user.findMany({
                where: {
                    username: {
                        startsWith: baseUsername,
                    },
                },
                select: { username: true },
            });

            if (similarUsernames.length === 0) {
                return validatedUsername;
            }

            const usernameSet = new Set(similarUsernames.map((u) => u.username));
            let number = 1;

            while (usernameSet.has(validatedUsername)) {
                validatedUsername = `${baseUsername}${number}`;
                number++;
            }

            return validatedUsername;
        }

        const username = await validatedUsername();

        // Étape 1: Récupérer l'image de Facebook
        const avatarResponse = await kyInstance.get(facebookUser.picture.data.url);
        const avatarBuffer = await avatarResponse.arrayBuffer();

        // Étape 2: Convertir l'image en WebP avec sharp
        const webpAvatar = await sharp(Buffer.from(avatarBuffer))
            .resize(500, 500) // Redimensionner en 500x500 pixels
            .webp({ quality: 90 })
            .toBuffer();

        // Étape 3: Définir le chemin pour enregistrer l'avatar (hors de /public)
        const avatarFilename = `avatar-${userId}.webp`;
        const avatarPath = path.join(process.cwd(), "data/uploads/avatars", avatarFilename);

        // Étape 4: S'assurer que le dossier existe et enregistrer l'image
        await fs.mkdir(path.dirname(avatarPath), { recursive: true });
        await fs.writeFile(avatarPath, webpAvatar);

        await prisma.user.create({
            data: {
                id: userId,
                username,
                avatarUrl: `/api/uploads/avatars/${avatarFilename}`, // Chemin API pour servir l'avatar
                displayName: facebookUser.name,
                facebookId: facebookUser.id,
            },
        });

        const session = await lucia.createSession(userId, {});
        const sessionCookie = lucia.createSessionCookie(session.id);
        cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

        return new Response(null, {
            status: 302,
            headers: {
                Location: "/",
            },
        });
    } catch (error) {
        console.error(error);

        if (error instanceof OAuth2RequestError) {
            return new Response(null, { status: 400 });
        }
        return new Response(null, { status: 500 });
    }
}
