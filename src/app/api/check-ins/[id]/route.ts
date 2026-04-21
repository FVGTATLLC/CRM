import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const checkIn = await prisma.locationCheckIn.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!checkIn) {
      return NextResponse.json(
        { error: "Check-in not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(checkIn);
  } catch (error) {
    console.error("Error fetching check-in:", error);
    return NextResponse.json(
      { error: "Failed to fetch check-in" },
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
    const {
      checkOutLatitude,
      checkOutLongitude,
      checkOutAddress,
      purpose,
      remarks,
      relatedToType,
      relatedToId,
      relatedToName,
    } = body;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    // Handle checkout flow
    if (checkOutLatitude !== undefined && checkOutLongitude !== undefined) {
      const existing = await prisma.locationCheckIn.findUnique({
        where: { id },
      });

      if (!existing) {
        return NextResponse.json(
          { error: "Check-in not found" },
          { status: 404 }
        );
      }

      const checkOutTime = new Date();
      const durationMinutes = Math.round(
        (checkOutTime.getTime() - new Date(existing.checkInTime).getTime()) / 60000
      );

      updateData.checkOutLatitude = checkOutLatitude;
      updateData.checkOutLongitude = checkOutLongitude;
      updateData.checkOutAddress = checkOutAddress;
      updateData.checkOutTime = checkOutTime;
      updateData.durationMinutes = durationMinutes;
      updateData.status = "CheckedOut";
    }

    // Allow updating other fields
    if (purpose !== undefined) updateData.purpose = purpose;
    if (remarks !== undefined) updateData.remarks = remarks;
    if (relatedToType !== undefined) updateData.relatedToType = relatedToType;
    if (relatedToId !== undefined) updateData.relatedToId = relatedToId;
    if (relatedToName !== undefined) updateData.relatedToName = relatedToName;

    const checkIn = await prisma.locationCheckIn.update({
      where: { id },
      data: updateData,
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    return NextResponse.json(checkIn);
  } catch (error) {
    console.error("Error updating check-in:", error);
    return NextResponse.json(
      { error: "Failed to update check-in" },
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
    await prisma.locationCheckIn.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Check-in deleted successfully" });
  } catch (error) {
    console.error("Error deleting check-in:", error);
    return NextResponse.json(
      { error: "Failed to delete check-in" },
      { status: 500 }
    );
  }
}
