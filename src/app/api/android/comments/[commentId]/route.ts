import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "../../utils/dTypes";

export function GET(
  req: NextRequest,
  { params: { commentId } }: { params: { commentId: string } },
) {
  return NextResponse.json({
    success: true,
    message: "Replies endpoint is operational.",
  } as ApiResponse<null>);
}