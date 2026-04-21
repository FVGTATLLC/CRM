import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "25");
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";
    const skip = (page - 1) * limit;

    const where: Prisma.RoleWhereInput = search
      ? {
          OR: [
            { roleName: { contains: search, mode: "insensitive" } },
            { roleDisplayName: { contains: search, mode: "insensitive" } },
            { userType: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      prisma.role.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { businessLine: true, department: true },
      }),
      prisma.role.count({ where }),
    ]);

    return NextResponse.json({ success: true, data, total, page, limit });
  } catch (error) {
    console.error("Roles GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch roles" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roleName, roleDisplayName, userType, roleStatus, remarks, businessLineId, departmentId } = body;

    if (!roleName || !userType || !businessLineId || !departmentId) {
      return NextResponse.json({ success: false, error: "Required fields missing" }, { status: 400 });
    }

    const role = await prisma.role.create({
      data: { roleName, roleDisplayName, userType, roleStatus: roleStatus || "Active", remarks, businessLineId, departmentId },
      include: { businessLine: true, department: true },
    });

    return NextResponse.json({ success: true, data: role }, { status: 201 });
  } catch (error) {
    console.error("Roles POST error:", error);
    return NextResponse.json({ success: false, error: "Failed to create role" }, { status: 500 });
  }
}
