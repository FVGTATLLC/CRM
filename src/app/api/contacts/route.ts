import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "25");
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const skip = (page - 1) * limit;

    const where: Prisma.ContactWhereInput = search
      ? {
          OR: [
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { company: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          account: true,
          owner: true,
        },
      }),
      prisma.contact.count({ where }),
    ]);

    return NextResponse.json({ success: true, data, total, page, limit });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch contacts" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      salutation,
      firstName,
      lastName,
      email,
      phone,
      mobile,
      jobTitle,
      department,
      company,
      address,
      city,
      state,
      country,
      zipCode,
      contactType,
      contactSource,
      contactStatus,
      roleTag,
      remarks,
      accountId,
      customerCategory,
    } = body;

    // customerCategory drives Corporate vs Retail; persisted in contactType
    const resolvedContactType = customerCategory || contactType;

    if (resolvedContactType === "Corporate" && !accountId) {
      return NextResponse.json(
        { success: false, error: "Corporate Account is required for Corporate contacts" },
        { status: 400 }
      );
    }

    if (!firstName) {
      return NextResponse.json(
        { success: false, error: "First name is required" },
        { status: 400 }
      );
    }

    if (!lastName) {
      return NextResponse.json(
        { success: false, error: "Last name is required" },
        { status: 400 }
      );
    }

    const data = await prisma.contact.create({
      data: {
        salutation,
        firstName,
        lastName,
        email,
        phone,
        mobile,
        jobTitle,
        department,
        company,
        address,
        city,
        state,
        country,
        zipCode,
        contactType: resolvedContactType,
        contactSource,
        contactStatus: contactStatus || "Active",
        roleTag,
        remarks,
        accountId: accountId || null,
        ownerId: user.id,
        createdById: user.id,
        createdByName: `${user.firstName} ${user.lastName}`,
      },
      include: {
        account: true,
        owner: true,
      },
    });

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error("Error creating contact:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create contact" },
      { status: 500 }
    );
  }
}
