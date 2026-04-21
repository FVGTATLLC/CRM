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

    const where: Prisma.RegionWhereInput = search
      ? {
          OR: [
            { regionName: { contains: search, mode: "insensitive" } },
            { regionCode: { contains: search, mode: "insensitive" } },
            { regionalManager: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      prisma.region.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          businessLine: true,
        },
      }),
      prisma.region.count({ where }),
    ]);

    return NextResponse.json({ success: true, data, total, page, limit });
  } catch (error) {
    console.error("Error fetching regions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch regions" },
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
    const { regionName, regionCode, regionalManager, regionStatus, remarks, businessLineId } = body;

    if (!regionName) {
      return NextResponse.json(
        { success: false, error: "Region name is required" },
        { status: 400 }
      );
    }

    if (!businessLineId) {
      return NextResponse.json(
        { success: false, error: "Business line ID is required" },
        { status: 400 }
      );
    }

    const data = await prisma.region.create({
      data: {
        regionName,
        regionCode,
        regionalManager,
        regionStatus: regionStatus || "Active",
        remarks,
        businessLineId,
        ownerId: user.id,
        ownerName: `${user.firstName} ${user.lastName}`,
        createdById: user.id,
        createdByName: `${user.firstName} ${user.lastName}`,
      },
      include: {
        businessLine: true,
      },
    });

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error("Error creating region:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create region" },
      { status: 500 }
    );
  }
}
