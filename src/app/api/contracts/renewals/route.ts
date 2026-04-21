import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const daysAhead = parseInt(searchParams.get("daysAhead") || "30");

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    // Find contracts expiring within the specified days
    const expiringContracts = await prisma.contract.findMany({
      where: {
        status: { in: ["Active", "Signed"] },
        endDate: {
          lte: futureDate,
          gte: new Date(),
        },
      },
      include: { owner: true, account: true },
      orderBy: { endDate: "asc" },
    });

    // Find already expired contracts
    const expiredContracts = await prisma.contract.findMany({
      where: {
        status: { in: ["Active", "Signed"] },
        endDate: { lt: new Date() },
      },
      include: { owner: true, account: true },
      orderBy: { endDate: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: {
        expiring: expiringContracts,
        expired: expiredContracts,
        summary: {
          expiringCount: expiringContracts.length,
          expiredCount: expiredContracts.length,
          daysAhead,
        },
      },
    });
  } catch (error) {
    console.error("Error checking renewals:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Auto-expire contracts and create notifications
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Auto-expire contracts past their end date
    const expired = await prisma.contract.updateMany({
      where: {
        status: { in: ["Active", "Signed"] },
        endDate: { lt: new Date() },
      },
      data: { status: "Expired" },
    });

    // Find contracts expiring in next 30 days and create notifications for owners
    const expiringSoon = await prisma.contract.findMany({
      where: {
        status: { in: ["Active", "Signed"] },
        endDate: {
          lte: new Date(Date.now() + 30 * 86400000),
          gte: new Date(),
        },
      },
      include: { account: true },
    });

    const notifications = [];
    for (const contract of expiringSoon) {
      const daysUntilExpiry = Math.ceil((new Date(contract.endDate!).getTime() - Date.now()) / 86400000);
      notifications.push({
        userId: contract.ownerId,
        type: "warning",
        title: `Contract Expiring: ${contract.title}`,
        description: `Contract with ${contract.account?.accountName || "Unknown"} expires in ${daysUntilExpiry} days. Consider renewal.`,
        actionUrl: `/contracts`,
      });
    }

    if (notifications.length > 0) {
      await prisma.notification.createMany({ data: notifications });
    }

    return NextResponse.json({
      success: true,
      data: {
        expiredCount: expired.count,
        notificationsSent: notifications.length,
      },
      message: `${expired.count} contracts expired, ${notifications.length} renewal notifications sent`,
    });
  } catch (error) {
    console.error("Error processing renewals:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
