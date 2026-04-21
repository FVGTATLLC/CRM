import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const role = await prisma.role.findUnique({
      where: { id },
      include: { businessLine: true, department: true, moduleAccess: { include: { module: true } }, fieldAccess: true },
    });

    if (!role) {
      return NextResponse.json({ success: false, error: "Role not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: role });
  } catch (error) {
    console.error("Role GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch role" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { roleName, roleDisplayName, userType, roleStatus, remarks, businessLineId, departmentId } = body;

    const role = await prisma.role.update({
      where: { id },
      data: { roleName, roleDisplayName, userType, roleStatus, remarks, businessLineId, departmentId },
      include: { businessLine: true, department: true },
    });

    return NextResponse.json({ success: true, data: role });
  } catch (error) {
    console.error("Role PUT error:", error);
    return NextResponse.json({ success: false, error: "Failed to update role" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.role.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Role deleted" });
  } catch (error) {
    console.error("Role DELETE error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete role" }, { status: 500 });
  }
}
