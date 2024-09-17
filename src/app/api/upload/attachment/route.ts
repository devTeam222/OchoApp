// app/api/upload/attachment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import prisma from '@/lib/prisma'; // Assurez-vous que le chemin est correct

const uploadDir = path.resolve('public/uploads/attachments');

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const filename = `${uuidv4()}_${file.name}`;
        const filepath = path.join(uploadDir, filename);

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        fs.writeFileSync(filepath, buffer);

        const fileUrl = `/uploads/attachments/${filename}`;
        
        // Enregistrez le fichier dans la base de données
        const media = await prisma.media.create({
            data: {
                url: fileUrl,
                type: file.type.startsWith("image") ? "IMAGE" : "VIDEO",
            },
        });

        return NextResponse.json({ mediaId: media.id, fileUrl });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'File upload failed' }, { status: 500 });
    }
}
