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
        zohoAccessToken: null,
        zohoRefreshToken: null,
        zohoTokenExpiry: null,
      },
    });

    return NextResponse.json({ success: true, message: "Zoho Meeting disconnected" });
  } catch (error) {
    console.error("Error disconnecting Zoho:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
