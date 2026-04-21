import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const businessLine = await prisma.businessLine.findUnique({
      where: { id },
    });

    if (!businessLine) {
      return NextResponse.json(
        { error: "Business line not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(businessLine);
  } catch (error) {
    console.error("Error fetching business line:", error);
    return NextResponse.json(
      { error: "Failed to fetch business line" },
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

    const businessLine = await prisma.businessLine.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(businessLine);
  } catch (error) {
    console.error("Error updating business line:", error);
    return NextResponse.json(
      { error: "Failed to update business line" },
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
    await prisma.businessLine.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Business line deleted successfully" });
  } catch (error) {
    console.error("Error deleting business line:", error);
    return NextResponse.json(
      { error: "Failed to delete business line" },
      { status: 500 }
    );
  }
}
