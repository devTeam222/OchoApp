import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";


export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  const session_token = authHeader?.split(" ")[1];
  const session = await prisma.session.deleteMany({
    where: {
      id: session_token,
    },
  });
    if (session.count === 0) {
        return NextResponse.json({
            success: false,
            message: "Session not found or already logged out",
            name: "session_not_found",
        });
    }
    return NextResponse.json({
        success: true,
        message: "Successfully logged out",
        data: null,
    });
}