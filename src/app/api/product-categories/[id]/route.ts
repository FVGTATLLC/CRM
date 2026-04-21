import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { NextResponse } from "next/server";

async function requireSuperAdmin(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return { error: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }), user: null };
  }
  if (user.userType !== "SuperAdmin") {
    return {
      error: NextResponse.json(
        { success: false, error: "Only Super Admin can manage product categories" },
        { status: 403 }
      ),
      user: null,
    };
  }
  return { error: null, user };
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, user } = await requireSuperAdmin(request);
  if (error) return error;
  const { id } = await params;
  try {
    const body = await request.json();
    const { name, description, isActive } = body;

    const data: Record<string, unknown> = {
      lastModifiedById: user!.id,
      lastModifiedByName: `${user!.firstName} ${user!.lastName}`,
    };
    if (name !== undefined) data.name = String(name).trim();
    if (description !== undefined) data.description = description || null;
    if (isActive !== undefined) data.isActive = !!isActive;

    const category = await prisma.productCategory.update({ where: { id }, data });
    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    console.error("Error updating product category:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update product category" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireSuperAdmin(request);
  if (error) return error;
  const { id } = await params;
  try {
    await prisma.productCategory.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Category deleted" });
  } catch (err) {
    console.error("Error deleting product category:", err);
    return NextResponse.json(
      { success: false, error: "Failed to delete product category" },
      { status: 500 }
    );
  }
}
