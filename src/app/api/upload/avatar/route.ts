"use server"

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const uploadDir = path.resolve("data/uploads/avatars");

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const filename = `${uuidv4()}_${file.name}`;
    const filepath = path.join(uploadDir, filename);

    // Assurer que le répertoire de téléchargement existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Enregistrer le fichier localement
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.promises.writeFile(filepath, buffer);

    // Retourner l'URL relative pour accéder au fichier
    const fileUrl = `/api/uploads/avatars/${filename}`;
    return NextResponse.json({ fileUrl });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json({ error: "File upload failed" }, { status: 500 });
  }
}
