import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const relatedToType = searchParams.get("relatedToType") || "";
    const relatedToId = searchParams.get("relatedToId") || "";

    const where: any = {};
    if (relatedToType) where.relatedToType = relatedToType;
    if (relatedToId) where.relatedToId = relatedToId;

    const data = await prisma.emailLog.findMany({
      where,
      include: { sentBy: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching email logs:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { relatedToType, relatedToId, relatedToName, recipient, subject, body: emailBody, sentDate, status, remarks, proposalId, contractId } = body;

    if (!recipient || !subject) {
      return NextResponse.json({ error: "Recipient and subject are required" }, { status: 400 });
    }

    const log = await prisma.emailLog.create({
      data: {
        relatedToType: relatedToType || "Other",
        relatedToId: relatedToId || "",
        relatedToName,
        recipient,
        subject,
        body: emailBody,
        sentDate: sentDate ? new Date(sentDate) : new Date(),
        status: status || "Sent",
        remarks,
        proposalId,
        contractId,
        sentById: user.id,
      },
      include: { sentBy: true },
    });

    return NextResponse.json({ success: true, data: log }, { status: 201 });
  } catch (error) {
    console.error("Error creating email log:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
