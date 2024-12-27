// /api/android/route.ts

import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Typage explicite des retours pour une meilleure lisibilité
export async function GET(req: NextRequest) {
  try {
    // Récupération des utilisateurs depuis la base de données
    const users = await prisma.user.findMany();

    // Vérification si la liste est vide
    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: "Aucun utilisateur trouvé." },
        { status: 404 }
      );
    }

    // Retour des utilisateurs en réponse JSON avec le statut 200
    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    // Gestion des erreurs (exemple : erreur de connexion à la base de données)
    console.error("Erreur lors de la récupération des utilisateurs :", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la récupération des utilisateurs." },
      { status: 500 }
    );
  }
}

