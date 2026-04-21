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

    const data = await prisma.document.findMany({
      where,
      include: { uploadedBy: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { relatedToType, relatedToId, relatedToName, fileName, fileUrl, fileSize, fileType, version, remarks, proposalId, contractId, accountId } = body;

    if (!relatedToType || !relatedToId || !fileName || !fileUrl) {
      return NextResponse.json({ error: "Related entity, file name and URL are required" }, { status: 400 });
    }

    const doc = await prisma.document.create({
      data: {
        relatedToType,
        relatedToId,
        relatedToName,
        fileName,
        fileUrl,
        fileSize,
        fileType,
        version: version || 1,
        remarks,
        proposalId,
        contractId,
        accountId,
        uploadedById: user.id,
      },
      include: { uploadedBy: true },
    });

    return NextResponse.json({ success: true, data: doc }, { status: 201 });
  } catch (error) {
    console.error("Error creating document:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
