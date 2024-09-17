// app/api/upload/avatar/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const uploadDir = path.resolve('public/uploads/avatar');

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const filename = `${uuidv4()}_${file.name}`;
        const filepath = path.join(uploadDir, filename);

        // Ensure upload directory exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Save file to local directory
        const buffer = Buffer.from(await file.arrayBuffer());
        fs.writeFileSync(filepath, buffer);

        // Return the URL to access the file
        const fileUrl = `/uploads/avatars/${filename}`;
        return NextResponse.json({ fileUrl });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'File upload failed' }, { status: 500 });
    }
}
