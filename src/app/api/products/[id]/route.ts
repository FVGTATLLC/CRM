import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch product" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const body = await request.json();
    const { category, name, price, imageUrl, description, status } = body;

    const data: Record<string, unknown> = {
      lastModifiedById: user.id,
      lastModifiedByName: `${user.firstName} ${user.lastName}`,
    };
    if (category !== undefined) data.category = category;
    if (name !== undefined) data.name = name;
    if (price !== undefined && price !== "") {
      const parsed = typeof price === "string" ? parseFloat(price) : price;
      if (isNaN(parsed) || parsed < 0) {
        return NextResponse.json(
          { success: false, error: "Price must be a valid non-negative number" },
          { status: 400 }
        );
      }
      data.price = parsed;
    }
    if (imageUrl !== undefined) data.imageUrl = imageUrl || null;
    if (description !== undefined) data.description = description || null;
    if (status !== undefined) data.status = status;

    const product = await prisma.product.update({ where: { id }, data });
    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ success: false, error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Product deleted" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ success: false, error: "Failed to delete product" }, { status: 500 });
  }
}
