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

    const where: Prisma.AccountWhereInput = {};

    // Role-based filtering
    const roleName = user.role?.roleName || "";
    if (user.userType !== "SuperAdmin" && user.userType !== "Admin") {
      if (roleName.includes("Growth")) {
        where.accountType = "Corporate";
      } else if (roleName.includes("Acquisition")) {
        where.accountType = "Hotel";
      }
    }

    // Account type filter from query param
    const accountTypeFilter = searchParams.get("accountType");
    if (accountTypeFilter) {
      where.accountType = accountTypeFilter;
    }

    if (search) {
      where.OR = [
        { accountName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { industry: { contains: search, mode: "insensitive" } },
        { hotelName: { contains: search, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.account.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          owner: true,
          contacts: true,
        },
      }),
      prisma.account.count({ where }),
    ]);

    return NextResponse.json({ success: true, data, total, page, limit });
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch accounts" },
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
      accountName,
      accountType,
      segment,
      subSegment,
      type,
      industry,
      website,
      phone,
      email,
      address,
      city,
      state,
      country,
      zipCode,
      annualRevenue,
      currency,
      numberOfEmployees,
      accountStatus,
      remarks,
      companySize,
      annualTravelSpend,
      numberOfTravelers,
      travelPolicy,
      bookingVolume,
      preferredAirlines,
      preferredHotels,
      hotelName,
      starRating,
      numberOfRooms,
      hotelChainGroup,
      hotelAmenities,
      roomTypes,
      rateRange,
      commissionStructure,
      distributionChannels,
      partnershipType,
    } = body;

    if (!accountName) {
      return NextResponse.json(
        { success: false, error: "Account name is required" },
        { status: 400 }
      );
    }

    if (!accountType) {
      return NextResponse.json(
        { success: false, error: "Account type is required" },
        { status: 400 }
      );
    }

    const data = await prisma.account.create({
      data: {
        accountName,
        accountType,
        segment,
        subSegment,
        type,
        industry,
        website,
        phone,
        email,
        address,
        city,
        state,
        country,
        zipCode,
        annualRevenue,
        currency,
        numberOfEmployees,
        accountStatus: accountStatus || "Active",
        remarks,
        companySize,
        annualTravelSpend: annualTravelSpend ? parseFloat(annualTravelSpend) : undefined,
        numberOfTravelers: numberOfTravelers ? parseInt(numberOfTravelers) : undefined,
        travelPolicy,
        bookingVolume,
        preferredAirlines,
        preferredHotels,
        hotelName,
        starRating: starRating ? parseInt(starRating) : undefined,
        numberOfRooms: numberOfRooms ? parseInt(numberOfRooms) : undefined,
        hotelChainGroup,
        hotelAmenities,
        roomTypes,
        rateRange,
        commissionStructure,
        distributionChannels,
        partnershipType,
        ownerId: user.id,
        createdById: user.id,
        createdByName: `${user.firstName} ${user.lastName}`,
      },
      include: {
        owner: true,
        contacts: true,
      },
    });

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error("Error creating account:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create account" },
      { status: 500 }
    );
  }
}
