import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Simple rate limiting (in-memory)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // max submissions per hour
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: "Too many submissions. Please try again later." }, { status: 429 });
    }

    const body = await request.json();
    const { firstName, lastName, email, phone, company, leadType, leadSource, description,
            hotelName, starRating, numberOfRooms, city, country, hotelAmenities, commissionStructure, partnershipType,
            companyIndustry, companySize, annualTravelSpend, numberOfTravelers, travelPolicy, jobTitle,
            utmSource, utmMedium, utmCampaign } = body;

    // Validation
    if (!firstName || !lastName || !leadType) {
      return NextResponse.json({ error: "First name, last name, and lead type are required" }, { status: 400 });
    }
    if (!email && !phone) {
      return NextResponse.json({ error: "Email or phone number is required" }, { status: 400 });
    }

    // Duplicate check
    let duplicateWarnings: any[] = [];
    try {
      const { checkLeadDuplicates } = await import("@/lib/duplicateCheck");
      duplicateWarnings = await checkLeadDuplicates(email, phone, company || hotelName);
    } catch (e) {
      // Non-blocking
    }

    // Create lead (unassigned — no ownerId required for public submissions)
    // Find a default system user to assign as owner
    const systemUser = await prisma.user.findFirst({ where: { userType: "SuperAdmin" } });
    if (!systemUser) {
      return NextResponse.json({ error: "System configuration error" }, { status: 500 });
    }

    const lead = await prisma.lead.create({
      data: {
        leadType,
        firstName,
        lastName,
        email: email || null,
        phone: phone || null,
        company: company || hotelName || null,
        jobTitle: jobTitle || null,
        leadSource: leadSource || "Website",
        leadStatus: "New",
        description: description || null,
        formSource: "WebForm",
        utmSource: utmSource || null,
        utmMedium: utmMedium || null,
        utmCampaign: utmCampaign || null,
        // Hotel fields
        hotelName: hotelName || null,
        starRating: starRating ? parseInt(starRating) : null,
        numberOfRooms: numberOfRooms ? parseInt(numberOfRooms) : null,
        city: city || null,
        country: country || null,
        hotelAmenities: hotelAmenities || null,
        commissionStructure: commissionStructure || null,
        partnershipType: partnershipType || null,
        // Corporate fields
        companyIndustry: companyIndustry || null,
        companySize: companySize || null,
        annualTravelSpend: annualTravelSpend ? parseFloat(annualTravelSpend) : null,
        numberOfTravelers: numberOfTravelers ? parseInt(numberOfTravelers) : null,
        travelPolicy: travelPolicy || null,
        // Owner = system user (unassigned for team lead distribution)
        ownerId: systemUser.id,
        createdByName: "Web Form",
      },
    });

    return NextResponse.json({
      success: true,
      data: { leadId: lead.id },
      warnings: duplicateWarnings.length > 0 ? duplicateWarnings : undefined,
      message: "Thank you! Your information has been received.",
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating public lead:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
