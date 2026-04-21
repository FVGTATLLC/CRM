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
    const sortBy = searchParams.get("sortBy") || "checkInTime";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const status = searchParams.get("status") || "";
    const ownerId = searchParams.get("ownerId") || "";
    const skip = (page - 1) * limit;

    const where: Prisma.LocationCheckInWhereInput = {};

    if (search) {
      where.OR = [
        { relatedToName: { contains: search, mode: "insensitive" } },
        { checkInAddress: { contains: search, mode: "insensitive" } },
        { checkOutAddress: { contains: search, mode: "insensitive" } },
        { purpose: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (ownerId) {
      where.ownerId = ownerId;
    }

    const [data, total] = await Promise.all([
      prisma.locationCheckIn.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          owner: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      }),
      prisma.locationCheckIn.count({ where }),
    ]);

    return NextResponse.json({ success: true, data, total, page, limit });
  } catch (error) {
    console.error("Error fetching check-ins:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch check-ins" },
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
      checkInLatitude,
      checkInLongitude,
      checkInAddress,
      relatedToType,
      relatedToId,
      relatedToName,
      purpose,
      remarks,
    } = body;

    if (checkInLatitude === undefined || checkInLongitude === undefined) {
      return NextResponse.json(
        { success: false, error: "Check-in latitude and longitude are required" },
        { status: 400 }
      );
    }

    // Check for existing active check-in
    const existingCheckIn = await prisma.locationCheckIn.findFirst({
      where: {
        ownerId: user.id,
        status: "CheckedIn",
      },
    });

    if (existingCheckIn) {
      return NextResponse.json(
        { success: false, error: "You already have an active check-in. Please check out first." },
        { status: 409 }
      );
    }

    const data = await prisma.locationCheckIn.create({
      data: {
        checkInLatitude,
        checkInLongitude,
        checkInAddress,
        relatedToType,
        relatedToId,
        relatedToName,
        purpose,
        remarks,
        status: "CheckedIn",
        ownerId: user.id,
        createdById: user.id,
        createdByName: `${user.firstName} ${user.lastName}`,
      },
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error("Error creating check-in:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create check-in" },
      { status: 500 }
    );
  }
}
