import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const item = await prisma.kybChecklist.findUnique({
      where: { id },
      include: { account: true },
    });

    if (!item) {
      return NextResponse.json({ error: "KYB item not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error("Error fetching KYB item:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const item = await prisma.kybChecklist.update({
      where: { id },
      data: body,
      include: { account: true },
    });

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error("Error updating KYB item:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.kybChecklist.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "KYB item deleted successfully" });
  } catch (error) {
    console.error("Error deleting KYB item:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
