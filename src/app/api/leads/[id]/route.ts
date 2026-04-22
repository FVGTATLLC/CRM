import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: { owner: true },
    });

    if (!lead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(lead);
  } catch (error) {
    console.error("Error fetching lead:", error);
    return NextResponse.json(
      { error: "Failed to fetch lead" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();

    if (body.estimatedValue !== undefined && body.estimatedValue !== null && body.estimatedValue !== "" && Number(body.estimatedValue) < 0) {
      return NextResponse.json(
        { error: "Lead value cannot be negative" },
        { status: 400 }
      );
    }
    if (body.annualTravelSpend !== undefined && body.annualTravelSpend !== null && body.annualTravelSpend !== "" && Number(body.annualTravelSpend) < 0) {
      return NextResponse.json(
        { error: "Annual travel spend cannot be negative" },
        { status: 400 }
      );
    }

    // Fetch prior state so we can detect a transition to "Signed"
    const prior = await prisma.lead.findUnique({ where: { id } });
    if (!prior) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Closed leads are immutable
    if (prior.leadStatus === "Closed") {
      return NextResponse.json(
        { error: "Closed leads cannot be edited" },
        { status: 403 }
      );
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: body,
      include: { owner: true },
    });

    // Auto-convert Corporate Lead to Account when status transitions to "Signed"
    const becameSigned =
      prior.leadStatus !== "Signed" && lead.leadStatus === "Signed";

    if (
      becameSigned &&
      lead.leadType === "Corporate" &&
      !lead.isConverted
    ) {
      const account = await prisma.account.create({
        data: {
          accountName: lead.company || `${lead.firstName} ${lead.lastName}`,
          accountType: "Corporate",
          segment: lead.segment,
          subSegment: lead.subSegment,
          type: lead.type,
          industry: lead.companyIndustry,
          companySize: lead.companySize,
          annualTravelSpend: lead.annualTravelSpend,
          email: lead.email,
          phone: lead.phone,
          address: lead.address,
          city: lead.city,
          state: lead.state,
          country: lead.country,
          zipCode: lead.zipCode,
          accountStatus: "Active",
          ownerId: lead.ownerId,
          createdByName: "Auto-converted from Lead",
        },
      });

      // Create primary Contact linked to the new Account
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
          contactType: "Corporate",
          contactStatus: "Active",
          accountId: account.id,
          ownerId: lead.ownerId,
          createdByName: "Auto-converted from Lead",
        },
      });

      await prisma.lead.update({
        where: { id },
        data: {
          isConverted: true,
          convertedAt: new Date(),
          convertedToAccountId: account.id,
        },
      });
    }

    return NextResponse.json(lead);
  } catch (error) {
    console.error("Error updating lead:", error);
    return NextResponse.json(
      { error: "Failed to update lead" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }
    if (lead.leadStatus === "Closed") {
      return NextResponse.json(
        { error: "Closed leads cannot be deleted" },
        { status: 403 }
      );
    }

    await prisma.lead.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Lead deleted successfully" });
  } catch (error) {
    console.error("Error deleting lead:", error);
    return NextResponse.json(
      { error: "Failed to delete lead" },
      { status: 500 }
    );
  }
}
