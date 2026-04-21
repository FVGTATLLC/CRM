import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getGoogleAuthUrl } from "@/lib/google";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const authUrl = getGoogleAuthUrl(user.id);
    return NextResponse.json({ success: true, authUrl });
  } catch (error) {
    console.error("Error generating Google auth URL:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
