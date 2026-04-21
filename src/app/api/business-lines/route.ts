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

    const where: Prisma.BusinessLineWhereInput = search
      ? {
          OR: [
            { businessLineName: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      prisma.businessLine.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.businessLine.count({ where }),
    ]);

    return NextResponse.json({ success: true, data, total, page, limit });
  } catch (error) {
    console.error("Error fetching business lines:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch business lines" },
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
    const { businessLineName, businessLineStatus, remarks } = body;

    if (!businessLineName) {
      return NextResponse.json(
        { success: false, error: "Business line name is required" },
        { status: 400 }
      );
    }

    const existing = await prisma.businessLine.findUnique({
      where: { businessLineName },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Business line name already exists" },
        { status: 409 }
      );
    }

    const data = await prisma.businessLine.create({
      data: {
        businessLineName,
        businessLineStatus: businessLineStatus || "Active",
        remarks,
        ownerId: user.id,
        ownerName: `${user.firstName} ${user.lastName}`,
        createdById: user.id,
        createdByName: `${user.firstName} ${user.lastName}`,
      },
    });

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error("Error creating business line:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create business line" },
      { status: 500 }
    );
  }
}
