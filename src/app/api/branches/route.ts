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

    const where: Prisma.BranchWhereInput = search
      ? {
          OR: [
            { branchCode: { contains: search, mode: "insensitive" } },
            { branchFullName: { contains: search, mode: "insensitive" } },
            { city: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      prisma.branch.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          businessLine: true,
          region: true,
          country: true,
        },
      }),
      prisma.branch.count({ where }),
    ]);

    return NextResponse.json({ success: true, data, total, page, limit });
  } catch (error) {
    console.error("Error fetching branches:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch branches" },
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
      branchCode,
      branchFullName,
      city,
      branchStatus,
      remarks,
      businessLineId,
      regionId,
      countryId,
    } = body;

    if (!branchCode) {
      return NextResponse.json(
        { success: false, error: "Branch code is required" },
        { status: 400 }
      );
    }

    if (!branchFullName) {
      return NextResponse.json(
        { success: false, error: "Branch full name is required" },
        { status: 400 }
      );
    }

    if (!businessLineId || !regionId || !countryId) {
      return NextResponse.json(
        { success: false, error: "Business line, region, and country are required" },
        { status: 400 }
      );
    }

    const data = await prisma.branch.create({
      data: {
        branchCode,
        branchFullName,
        city,
        branchStatus: branchStatus || "Active",
        remarks,
        businessLineId,
        regionId,
        countryId,
        ownerId: user.id,
        ownerName: `${user.firstName} ${user.lastName}`,
        createdById: user.id,
        createdByName: `${user.firstName} ${user.lastName}`,
      },
      include: {
        businessLine: true,
        region: true,
        country: true,
      },
    });

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error("Error creating branch:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create branch" },
      { status: 500 }
    );
  }
}
