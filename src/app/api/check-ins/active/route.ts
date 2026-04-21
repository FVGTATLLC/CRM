import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const data = await prisma.locationCheckIn.findFirst({
      where: {
        ownerId: user.id,
        status: "CheckedIn",
      },
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: data || null });
  } catch (error) {
    console.error("Error fetching active check-in:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch active check-in" },
      { status: 500 }
    );
  }
}
