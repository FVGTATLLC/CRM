import { prisma } from "@/lib/db";
import { getAuthUser, hashPassword } from "@/lib/auth";
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

    const where: Prisma.UserWhereInput = search
      ? {
          OR: [
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { username: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          role: true,
          businessLine: true,
          department: true,
          branch: true,
          country: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    // Remove passwordHash from response
    const sanitizedData = data.map(({ passwordHash, ...rest }) => rest);

    return NextResponse.json({ success: true, data: sanitizedData, total, page, limit });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
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
      username,
      email,
      password,
      phone,
      phoneType,
      dialingCode,
      designation,
      subDepartment,
      teamFunction,
      userType,
      reportingTo,
      altEscalation,
      timezone,
      language,
      numberFormat,
      dateFormat,
      avatarUrl,
      userStatus,
      businessLineId,
      regionId,
      countryId,
      branchId,
      departmentId,
      roleId,
    } = body;

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

    if (!username) {
      return NextResponse.json(
        { success: false, error: "Username is required" },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { success: false, error: "Password is required" },
        { status: 400 }
      );
    }

    // Check for existing username or email
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error:
            existingUser.username === username
              ? "Username already exists"
              : "Email already exists",
        },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const data = await prisma.user.create({
      data: {
        salutation,
        firstName,
        lastName,
        username,
        email,
        passwordHash,
        phone,
        phoneType,
        dialingCode,
        designation,
        subDepartment,
        teamFunction,
        userType: userType || "Standard",
        reportingTo,
        altEscalation,
        timezone,
        language,
        numberFormat,
        dateFormat,
        avatarUrl,
        userStatus: userStatus || "Active",
        businessLineId,
        regionId,
        countryId,
        branchId,
        departmentId,
        roleId,
        createdById: authUser.id,
        createdByName: `${authUser.firstName} ${authUser.lastName}`,
      },
      include: {
        role: true,
        businessLine: true,
        department: true,
        branch: true,
        country: true,
      },
    });

    // Remove passwordHash from response
    const { passwordHash: _, ...sanitizedData } = data;

    return NextResponse.json({ success: true, data: sanitizedData }, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create user" },
      { status: 500 }
    );
  }
}
