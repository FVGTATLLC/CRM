import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { leadId } = body;

    if (!leadId) {
      return NextResponse.json({ error: "Lead ID is required" }, { status: 400 });
    }

    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    if (lead.isConverted) {
      return NextResponse.json({ error: "Lead is already converted" }, { status: 400 });
    }

    // Create Account from Lead
    const account = await prisma.account.create({
      data: {
        accountName: lead.company || `${lead.firstName} ${lead.lastName}`,
        accountType: lead.leadType,
        segment: lead.segment,
        subSegment: lead.subSegment,
        type: lead.type,
        email: lead.email,
        phone: lead.phone,
        address: lead.address,
        city: lead.city,
        state: lead.state,
        country: lead.country,
        zipCode: lead.zipCode,
        accountStatus: "Active",
        ownerId: lead.ownerId,
        createdById: user.id,
        createdByName: `${user.firstName} ${user.lastName}`,
      },
    });

    // Map type-specific fields to the account
    if (lead.leadType === "Corporate") {
      await prisma.account.update({
        where: { id: account.id },
        data: {
          industry: lead.companyIndustry,
          companySize: lead.companySize,
          annualTravelSpend: lead.annualTravelSpend,
          numberOfTravelers: lead.numberOfTravelers,
          travelPolicy: lead.travelPolicy,
          preferredAirlines: lead.preferredAirlines,
          preferredHotels: lead.preferredHotels,
          bookingVolume: lead.travelBookingVolume,
        },
      });
    } else if (lead.leadType === "Hotel") {
      await prisma.account.update({
        where: { id: account.id },
        data: {
          hotelName: lead.hotelName,
          starRating: lead.starRating,
          numberOfRooms: lead.numberOfRooms,
          hotelAmenities: lead.hotelAmenities,
          commissionStructure: lead.commissionStructure,
          roomTypes: lead.roomTypes,
          rateRange: lead.rateRange,
          partnershipType: lead.partnershipType,
          distributionChannels: lead.currentDistributionChannels,
        },
      });
    }

    // Create Contact from Lead
    await prisma.contact.create({
      data: {
        salutation: lead.salutation,
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone,
        mobile: lead.mobile,
        company: lead.company,
        jobTitle: lead.jobTitle,
        contactType: lead.leadType,
        contactStatus: "Active",
        accountId: account.id,
        ownerId: lead.ownerId,
        createdById: user.id,
        createdByName: `${user.firstName} ${user.lastName}`,
      },
    });

    // Update Lead as converted
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        isConverted: true,
        convertedAt: new Date(),
        convertedToAccountId: account.id,
        leadStatus: "Won",
      },
    });

    return NextResponse.json({ success: true, data: { accountId: account.id }, message: "Lead converted successfully" });
  } catch (error) {
    console.error("Error converting lead:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
