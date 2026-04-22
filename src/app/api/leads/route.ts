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
    const assigned = searchParams.get("assigned") || "";
    const skip = (page - 1) * limit;

    const where: Prisma.LeadWhereInput = {};

    // Role-based filtering
    const roleName = user.role?.roleName || "";
    if (user.userType !== "SuperAdmin" && user.userType !== "Admin") {
      if (roleName.includes("Growth")) {
        where.leadType = "Corporate";
      } else if (roleName.includes("Acquisition")) {
        where.leadType = "Hotel";
      }
    }

    // Explicit leadType filter (from typed pages)
    const leadTypeFilter = searchParams.get("leadType");
    if (leadTypeFilter) {
      where.leadType = leadTypeFilter;
    }

    // Filter for unassigned leads
    if (assigned === "unassigned") {
      where.assignedToId = null;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { hotelName: { contains: search, mode: "insensitive" } },
        { companyIndustry: { contains: search, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.lead.count({ where }),
    ]);

    return NextResponse.json({ success: true, data, total, page, limit });
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch leads" },
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
      leadType,
      segment,
      subSegment,
      type,
      salutation,
      firstName,
      lastName,
      email,
      phone,
      mobile,
      company,
      jobTitle,
      leadSource,
      leadStatus,
      rating,
      estimatedValue,
      currency,
      description,
      address,
      city,
      state,
      country,
      zipCode,
      remarks,
      // Corporate-specific fields
      companyIndustry,
      companySize,
      annualTravelSpend,
      numberOfTravelers,
      travelPolicy,
      preferredAirlines,
      preferredHotels,
      travelBookingVolume,
      department,
      // Hotel-specific fields
      hotelName,
      starRating,
      numberOfRooms,
      hotelAmenities,
      commissionStructure,
      roomTypes,
      rateRange,
      partnershipType,
      currentDistributionChannels,
      // Product-based booking details (Lead Management form)
      productDetails,
    } = body;

    if (!leadType) {
      return NextResponse.json(
        { success: false, error: "Lead type is required" },
        { status: 400 }
      );
    }

    if (!firstName) {
      return NextResponse.json(
        { success: false, error: "First name is required" },
        { status: 400 }
      );
    }

    if (estimatedValue !== undefined && estimatedValue !== null && estimatedValue !== "" && Number(estimatedValue) < 0) {
      return NextResponse.json(
        { success: false, error: "Lead value cannot be negative" },
        { status: 400 }
      );
    }
    if (annualTravelSpend !== undefined && annualTravelSpend !== null && annualTravelSpend !== "" && Number(annualTravelSpend) < 0) {
      return NextResponse.json(
        { success: false, error: "Annual travel spend cannot be negative" },
        { status: 400 }
      );
    }

    // Check for duplicate leads before creation
    const { checkLeadDuplicates } = await import("@/lib/duplicateCheck");
    const duplicateWarnings = await checkLeadDuplicates(email, phone, company);

    // Generate next leadNumber (LD-00001 format) atomically by picking the max existing number
    const lastWithNumber = await prisma.lead.findFirst({
      where: { leadNumber: { not: null } },
      orderBy: { createdAt: "desc" },
      select: { leadNumber: true },
    });
    let nextN = 1;
    if (lastWithNumber?.leadNumber) {
      // Find the actual max across all leads (in case createdAt order differs from numeric order)
      const all = await prisma.lead.findMany({
        where: { leadNumber: { not: null } },
        select: { leadNumber: true },
      });
      let maxN = 0;
      for (const l of all) {
        const m = (l.leadNumber || "").match(/LD-(\d+)/);
        if (m) {
          const n = parseInt(m[1], 10);
          if (n > maxN) maxN = n;
        }
      }
      nextN = maxN + 1;
    }
    const leadNumber = `LD-${String(nextN).padStart(5, "0")}`;

    const data = await prisma.lead.create({
      data: {
        leadNumber,
        leadType,
        segment,
        subSegment,
        type,
        salutation,
        firstName,
        lastName,
        email,
        phone,
        mobile,
        company,
        jobTitle,
        leadSource,
        leadStatus: leadStatus || "New",
        rating,
        estimatedValue,
        currency,
        description,
        address,
        city,
        state,
        country,
        zipCode,
        remarks,
        // Corporate-specific fields
        companyIndustry,
        companySize,
        annualTravelSpend: annualTravelSpend ? parseFloat(annualTravelSpend) : undefined,
        numberOfTravelers: numberOfTravelers ? parseInt(numberOfTravelers) : undefined,
        travelPolicy,
        preferredAirlines,
        preferredHotels,
        travelBookingVolume,
        department,
        // Hotel-specific fields
        hotelName,
        starRating: starRating ? parseInt(starRating) : undefined,
        numberOfRooms: numberOfRooms ? parseInt(numberOfRooms) : undefined,
        hotelAmenities,
        commissionStructure,
        roomTypes,
        rateRange,
        partnershipType,
        currentDistributionChannels,
        productDetails: productDetails && typeof productDetails === "object" ? productDetails : undefined,
        ownerId: user.id,
        createdById: user.id,
        createdByName: `${user.firstName} ${user.lastName}`,
      },
    });

    return NextResponse.json({ success: true, data, warnings: duplicateWarnings }, { status: 201 });
  } catch (error) {
    console.error("Error creating lead:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create lead" },
      { status: 500 }
    );
  }
}
