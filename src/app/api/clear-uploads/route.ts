import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";

const uploadDir = path.resolve('public/uploads/attachments');

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");

        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new Response(JSON.stringify({ error: "Invalid authorization header" }), { status: 401 });
        }

        // Rechercher les médias inutilisés
        const unusedMedia = await prisma.media.findMany({
            where: {
                postId: null,
                ...(process.env.NODE_ENV === "production" ? {
                    createdAt: {
                        lte: new Date(Date.now() - 24 * 3600 * 1000) // 1 jour
                    }
                } : {})
            },
            select: {
                id: true,
                url: true,
            }
        });

        // Supprimer les fichiers locaux
        unusedMedia.forEach(media => {
            const filePath = path.join(uploadDir, media.url.split('/uploads/attachments/')[1]);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        });

        // Supprimer les entrées de la base de données
        await prisma.media.deleteMany({
            where: {
                id: {
                    in: unusedMedia.map(m => m.id)
                }
            }
        });

        return new Response(null, { status: 200 });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
    }
}
