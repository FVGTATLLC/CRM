import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.userType !== "SuperAdmin") {
      return NextResponse.json({ error: "SuperAdmin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, confirmDeletion } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }
    if (confirmDeletion !== true) {
      return NextResponse.json({ error: "Please confirm deletion by setting confirmDeletion: true" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Anonymize PII instead of hard delete (preserves referential integrity)
    await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: "Deleted",
        lastName: "User",
        email: `deleted_${userId}@removed.local`,
        username: `deleted_${userId}`,
        phone: null,
        designation: null,
        avatarUrl: null,
        userStatus: "Deleted",
      },
    });

    // Log the deletion action
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        action: "DataDeletion",
        moduleName: "User",
        recordId: userId,
        recordName: `${targetUser.firstName} ${targetUser.lastName}`,
        details: `User data anonymized per privacy request by ${user.firstName} ${user.lastName}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "User data has been anonymized successfully",
    });
  } catch (error) {
    console.error("Error deleting data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
