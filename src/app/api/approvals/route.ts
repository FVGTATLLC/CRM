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
    const status = searchParams.get("status") || "";
    const pendingForMe = searchParams.get("pendingForMe") === "true";

    const where: any = {};
    if (relatedToType) where.relatedToType = relatedToType;
    if (relatedToId) where.relatedToId = relatedToId;
    if (status) where.status = status;
    if (pendingForMe) {
      where.status = "Pending";
      where.steps = { some: { approverId: user.id, status: "Pending" } };
    }

    const data = await prisma.approvalRequest.findMany({
      where,
      include: {
        requestedBy: true,
        steps: {
          include: { approver: true },
          orderBy: { stepNumber: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching approvals:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { relatedToType, relatedToId, relatedToName, requestType, remarks, approverIds } = body;

    if (!relatedToType || !relatedToId || !requestType) {
      return NextResponse.json({ error: "Related entity and request type are required" }, { status: 400 });
    }

    const approval = await prisma.approvalRequest.create({
      data: {
        relatedToType,
        relatedToId,
        relatedToName,
        requestType,
        remarks,
        status: "Pending",
        currentStep: 1,
        requestedById: user.id,
        steps: {
          create: (approverIds || []).map((approverId: string, index: number) => ({
            stepNumber: index + 1,
            approverId,
            status: index === 0 ? "Pending" : "Waiting",
          })),
        },
      },
      include: {
        requestedBy: true,
        steps: { include: { approver: true }, orderBy: { stepNumber: "asc" } },
      },
    });

    return NextResponse.json({ success: true, data: approval }, { status: 201 });
  } catch (error) {
    console.error("Error creating approval:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
