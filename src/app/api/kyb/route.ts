import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "25");
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const accountId = searchParams.get("accountId") || "";

    const where: any = {};
    if (accountId) where.accountId = accountId;
    if (search) {
      where.OR = [
        { documentType: { contains: search, mode: "insensitive" } },
        { documentName: { contains: search, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.kybChecklist.findMany({
        where,
        include: { account: true },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.kybChecklist.count({ where }),
    ]);

    return NextResponse.json({ success: true, data, total, page, limit });
  } catch (error) {
    console.error("Error fetching KYB checklist:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { documentType, documentName, accountId, remarks, fileUrl, fileName } = body;

    if (!documentType || !accountId) {
      return NextResponse.json({ error: "Document type and Account are required" }, { status: 400 });
    }

    const item = await prisma.kybChecklist.create({
      data: {
        documentType,
        documentName,
        accountId,
        remarks,
        fileUrl,
        fileName,
        isUploaded: !!fileUrl,
        status: fileUrl ? "Uploaded" : "Pending",
        createdById: user.id,
        createdByName: `${user.firstName} ${user.lastName}`,
      },
      include: { account: true },
    });

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error) {
    console.error("Error creating KYB item:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
