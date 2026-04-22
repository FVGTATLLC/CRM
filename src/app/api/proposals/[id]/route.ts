import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: { owner: true, account: true },
    });

    if (!proposal) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(proposal);
  } catch (error) {
    console.error("Error fetching proposal:", error);
    return NextResponse.json(
      { error: "Failed to fetch proposal" },
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

    if (body.value !== undefined && body.value !== null && body.value !== "" && Number(body.value) < 0) {
      return NextResponse.json(
        { error: "Proposal value cannot be negative" },
        { status: 400 }
      );
    }
    if (body.value) body.value = parseFloat(body.value);
    if (body.validUntil) body.validUntil = new Date(body.validUntil);

    // If leadId changed, refresh denormalized linkedTo* fields
    if (body.leadId) {
      const lead = await prisma.lead.findUnique({ where: { id: body.leadId } });
      if (lead) {
        const productName = (lead.productDetails as Record<string, string> | null)?.productName ?? "";
        body.linkedToType = "Lead";
        body.linkedToId = body.leadId;
        body.linkedToName = lead.leadNumber
          ? `${lead.leadNumber} - ${productName}`
          : productName || `${lead.firstName} ${lead.lastName}`.trim();
      }
    }

    const proposal = await prisma.proposal.update({
      where: { id },
      data: body,
      include: { owner: true, account: true, lead: true },
    });

    return NextResponse.json(proposal);
  } catch (error) {
    console.error("Error updating proposal:", error);
    return NextResponse.json(
      { error: "Failed to update proposal" },
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
    await prisma.proposal.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Proposal deleted successfully" });
  } catch (error) {
    console.error("Error deleting proposal:", error);
    return NextResponse.json(
      { error: "Failed to delete proposal" },
      { status: 500 }
    );
  }
}
