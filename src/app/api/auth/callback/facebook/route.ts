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
import path from "path";
import { useUploadThing } from "@/lib/uploadthing";

export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get("code");
    const {startUpload} = useUploadThing("avatar")

    if (!code) {
        return new Response(null, { status: 400 });
    }

    try {
        const { accessToken, accessTokenExpiresAt } = await facebook.validateAuthorizationCode(code);

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
        const avatarBlob = await avatarResponse.blob();

        // Étape 2: Convertir l'image en WebP avec Canvas
        const imageBitmap = await createImageBitmap(avatarBlob);
        const canvas = new OffscreenCanvas(500, 500); // Canvas de 500x500 pixels
        const ctx = canvas.getContext("2d");
        if (ctx) {
            ctx.drawImage(imageBitmap, 0, 0, 500, 500);
        }

        // Convertir le canvas en Blob (format WebP)
        const webpAvatarBlob = await canvas.convertToBlob({ type: "image/webp", quality: 0.9 });

        // Fonction d'upload local
        async function uploadAvatarLocally(webpBlob: Blob): Promise<string | null> {
            const avatarFilename = `avatar-${userId}.webp`;
            const avatarPath = path.join(process.cwd(), "data/uploads/avatars", avatarFilename);
            const arrayBuffer = await webpBlob.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            
            try {
                await fs.mkdir(path.dirname(avatarPath), { recursive: true });
                await fs.writeFile(avatarPath, uint8Array);
                return `/api/uploads/avatars/${avatarFilename}`; // Chemin de l'avatar local
            } catch (error) {
                console.error("Local upload failed", error);
                return null;
            }
        }

        // Fonction d'upload avec Uploadthing
        async function uploadAvatarWithUploadthing(webpBlob: File): Promise<string | null> {
            try {
                const uploadResult = await startUpload([webpBlob]);
                return uploadResult?.[0].appUrl || null; // URL de l'avatar Uploadthing
            } catch (error) {
                console.error("Uploadthing upload failed", error);
                return null;
            }
        }
        const webpAvatarFile = new File([webpAvatarBlob], `avatar-${userId}.webp`, { type: "image/webp" });

        // Tentative d'upload local, puis fallback avec Uploadthing
        const avatarUrl = await uploadAvatarLocally(webpAvatarBlob) || await uploadAvatarWithUploadthing(webpAvatarFile);

        if (!avatarUrl) {
            return new Response("Upload failed", { status: 500 });
        }

        // Enregistrement de l'utilisateur dans la base de données
        await prisma.user.create({
            data: {
                id: userId,
                username,
                avatarUrl,
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


