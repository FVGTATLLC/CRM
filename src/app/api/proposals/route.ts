import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "25");
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const skip = (page - 1) * limit;

    const where: Prisma.ProposalWhereInput = search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { linkedToName: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      prisma.proposal.findMany({
        where,
        include: { owner: true, account: true, lead: true },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.proposal.count({ where }),
    ]);

    return NextResponse.json({ success: true, data, total, page, limit });
  } catch (error) {
    console.error("Error fetching proposals:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch proposals" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      title,
      value,
      currency,
      description,
      validUntil,
      status,
      remarks,
      accountId,
      leadId,
    } = body;

    if (!title) {
      return NextResponse.json(
        { success: false, error: "Title is required" },
        { status: 400 }
      );
    }

    if (!leadId) {
      return NextResponse.json(
        { success: false, error: "Lead is required" },
        { status: 400 }
      );
    }

    if (value !== undefined && value !== null && value !== "" && Number(value) < 0) {
      return NextResponse.json(
        { success: false, error: "Proposal value cannot be negative" },
        { status: 400 }
      );
    }

    // Resolve denormalized linkedTo* from the lead so legacy fields stay populated
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      return NextResponse.json(
        { success: false, error: "Selected lead not found" },
        { status: 404 }
      );
    }
    const productName = (lead.productDetails as Record<string, string> | null)?.productName ?? "";
    const linkedToName = lead.leadNumber
      ? `${lead.leadNumber} - ${productName}`
      : productName || `${lead.firstName} ${lead.lastName}`.trim();

    const data = await prisma.proposal.create({
      data: {
        title,
        linkedToType: "Lead",
        linkedToId: leadId,
        linkedToName,
        leadId,
        value: value ? parseFloat(value) : null,
        currency,
        description,
        validUntil: validUntil ? new Date(validUntil) : null,
        status: status || "Draft",
        remarks,
        accountId,
        ownerId: user.id,
        createdById: user.id,
        createdByName: `${user.firstName} ${user.lastName}`,
      },
      include: { owner: true, account: true, lead: true },
    });

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error("Error creating proposal:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create proposal" },
      { status: 500 }
    );
  }
}
