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

    const where: Prisma.CountryWhereInput = search
      ? {
          OR: [
            { countryName: { contains: search, mode: "insensitive" } },
            { continent: { contains: search, mode: "insensitive" } },
            { countryCodeISO2: { contains: search, mode: "insensitive" } },
            { countryCodeISO3: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      prisma.country.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.country.count({ where }),
    ]);

    return NextResponse.json({ success: true, data, total, page, limit });
  } catch (error) {
    console.error("Error fetching countries:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch countries" },
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
      countryName,
      continent,
      subContinent,
      countryCodeISO2,
      countryCodeISO3,
      countryDialingCode,
      countryPresenceStatus,
      countryStatus,
      remarks,
    } = body;

    if (!countryName) {
      return NextResponse.json(
        { success: false, error: "Country name is required" },
        { status: 400 }
      );
    }

    const existing = await prisma.country.findUnique({
      where: { countryName },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Country name already exists" },
        { status: 409 }
      );
    }

    const data = await prisma.country.create({
      data: {
        countryName,
        continent,
        subContinent,
        countryCodeISO2,
        countryCodeISO3,
        countryDialingCode,
        countryPresenceStatus: countryPresenceStatus ?? false,
        countryStatus: countryStatus || "Active",
        remarks,
        ownerId: user.id,
        ownerName: `${user.firstName} ${user.lastName}`,
        createdById: user.id,
        createdByName: `${user.firstName} ${user.lastName}`,
      },
    });

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error("Error creating country:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create country" },
      { status: 500 }
    );
  }
}
