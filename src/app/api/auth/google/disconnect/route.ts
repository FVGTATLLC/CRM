import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        googleAccessToken: null,
        googleRefreshToken: null,
        googleTokenExpiry: null,
        googleCalendarId: null,
      },
    });

    return NextResponse.json({ success: true, message: "Google Calendar disconnected" });
  } catch (error) {
    console.error("Error disconnecting Google:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
