import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { NextResponse } from "next/server";

// GET: any authenticated user can read (Products form needs it for dropdown)
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
    const activeOnly = searchParams.get("activeOnly") === "true";

    const data = await prisma.productCategory.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, data, total: data.length });
  } catch (error) {
    console.error("Error fetching product categories:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch product categories" },
      { status: 500 }
    );
  }
}

// POST: SuperAdmin only
export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    if (user.userType !== "SuperAdmin") {
      return NextResponse.json(
        { success: false, error: "Only Super Admin can manage product categories" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, isActive } = body;

    if (!name || !String(name).trim()) {
      return NextResponse.json(
        { success: false, error: "Category name is required" },
        { status: 400 }
      );
    }

    const existing = await prisma.productCategory.findUnique({
      where: { name: String(name).trim() },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "A category with this name already exists" },
        { status: 409 }
      );
    }

    const data = await prisma.productCategory.create({
      data: {
        name: String(name).trim(),
        description: description || null,
        isActive: isActive !== undefined ? !!isActive : true,
        createdById: user.id,
        createdByName: `${user.firstName} ${user.lastName}`,
      },
    });

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error("Error creating product category:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create product category" },
      { status: 500 }
    );
  }
}
