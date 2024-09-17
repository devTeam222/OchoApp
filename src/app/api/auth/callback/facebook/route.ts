import { facebook, google, lucia } from "@/auth";
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

    if (
        !code
    ) {
        return new Response(null, { status: 400 })
    }

    try {
        const {
            accessToken,
            accessTokenExpiresAt
        } = await facebook.validateAuthorizationCode(code);

        const facebookUser = await kyInstance
            .get(`https://graph.facebook.com/me?access_token=${accessToken}&fields=id,name,picture`)
            .json<{
                id: string,
                name: string,
                email: string,
                picture: {
                    data: {
                        url: string,
                        height: number,
                        is_silhouette: boolean,
                        width: number
                    }
                }
            }>();

        const existingUser = await prisma.user.findUnique({
            where: { facebookId: facebookUser.id }
        })

        if (existingUser) {
            const session = await lucia.createSession(existingUser.id, {});
            const sessionCookie = lucia.createSessionCookie(session.id);

            cookies().set(
                sessionCookie.name,
                sessionCookie.value,
                sessionCookie.attributes
            )

            return new Response(null, {
                status: 302,
                headers: {
                    Location: "/",
                }
            })

        }

        const userId = generateIdFromEntropySize(10);


        async function validatedUsername() {
            const baseUsername = slugify(facebookUser.name);
            let validatedUsername = baseUsername;

            // Chercher tous les noms d'utilisateur qui commencent par le nom de base
            const similarUsernames = await prisma.user.findMany({
                where: {
                    username: {
                        startsWith: baseUsername,
                    }
                },
                select: { username: true }
            });

            if (similarUsernames.length === 0) {
                // Si aucun nom d'utilisateur similaire, le nom est disponible
                return validatedUsername;
            }

            // Extraire uniquement les suffixes numériques
            const usernameSet = new Set(similarUsernames.map(u => u.username));
            let number = 1;

            // Trouver le premier suffixe disponible
            while (usernameSet.has(validatedUsername)) {
                validatedUsername = `${baseUsername}${number}`;
                number++;
            }

            return validatedUsername;
        }

        const username = await validatedUsername();

        // Step 1: Fetch the image from Facebook
        const avatarResponse = await kyInstance.get(facebookUser.picture.data.url);
        const avatarBuffer = await avatarResponse.arrayBuffer();

        // Step 2: Convert the image to WebP using sharp
        const webpAvatar = await sharp(Buffer.from(avatarBuffer))
            .resize(500, 500) // Ajuste à 500x500 pixels
            .webp({ quality: 90 }).toBuffer();

        // Step 3: Define the path to save the avatar
        const avatarFilename = `avatar-${userId}.webp`;
        const avatarPath = path.join(process.cwd(), "public", "uploads", "avatars", avatarFilename);

        // Step 4: Save the file to the public/uploads/avatars folder
        await fs.mkdir(path.dirname(avatarPath), { recursive: true });
        await fs.writeFile(avatarPath, webpAvatar);

        await prisma.user.create({
            data: {
                id: userId,
                username,
                avatarUrl: `/uploads/avatars/${avatarFilename}`,
                displayName: facebookUser.name,
                facebookId: facebookUser.id
            },
        });

        const session = await lucia.createSession(userId, {});
        const sessionCookie = lucia.createSessionCookie(session.id);
        cookies().set(
            sessionCookie.name,
            sessionCookie.value,
            sessionCookie.attributes,
        );

        return new Response(null, {
            status: 302,
            headers: {
                Location: "/",
            }
        })
    } catch (error) {
        console.error(error);

        if (error instanceof OAuth2RequestError) {
            return new Response(null, {
                status: 400,
            })
        }
        return new Response(null, {
            status: 500,
        })
    }

}