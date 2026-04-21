import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.userType !== "SuperAdmin" && user.userType !== "Admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const userId = searchParams.get("userId");

    if (!email && !userId) {
      return NextResponse.json({ error: "email or userId parameter is required" }, { status: 400 });
    }

    const targetUser = await prisma.user.findFirst({
      where: userId ? { id: userId } : { email: email! },
      include: {
        leads: true,
        accounts: true,
        contacts: true,
        activities: true,
        proposals: true,
        contracts: true,
        notifications: true,
        locationCheckIns: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Remove sensitive fields
    const { passwordHash, ...safeUser } = targetUser;

    return NextResponse.json({
      success: true,
      data: {
        exportedAt: new Date().toISOString(),
        exportedBy: `${user.firstName} ${user.lastName}`,
        user: safeUser,
      },
    });
  } catch (error) {
    console.error("Error exporting data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
