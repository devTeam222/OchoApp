import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Répertoire de base pour les fichiers téléchargés
const downloadBaseDir = path.resolve("data/downloads");

export async function GET(request: NextRequest) {
  const fileName = "OchoApp.apk"
  try {
    // Construire le chemin complet du fichier
    const filePath = path.join(downloadBaseDir, fileName);

    // Vérifier si le fichier existe
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Lire le fichier dans un buffer
    const fileBuffer = await fs.promises.readFile(filePath);

    // Détecter le type de contenu en fonction de l'extension du fichier
    const ext = path.extname(filePath).toLowerCase();
    let contentType = "application/octet-stream"; // Type par défaut
    if (ext === ".apk") contentType = "application/vnd.android.package-archive";
    let size = fileBuffer.length;

    // Retourner le fichier avec le type de contenu approprié
    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${path.basename(filePath)}"`, // Pour forcer le téléchargement
        "Content-Length": size.toString(),
      },
    });
  } catch (error) {
    console.error("Error serving file:", error);
    return NextResponse.json({ error: "Error retrieving file" }, { status: 500 });
  }
}
