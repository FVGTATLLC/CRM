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
    const activityType = searchParams.get("activityType") || "";
    const skip = (page - 1) * limit;

    const where: Prisma.ActivityWhereInput = {};

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ];
    }

    if (activityType) {
      where.activityType = activityType;
    }

    const [data, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.activity.count({ where }),
    ]);

    return NextResponse.json({ success: true, data, total, page, limit });
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch activities" },
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
      activityType,
      subject,
      description,
      activityDate,
      startTime,
      endTime,
      duration,
      location,
      status,
      priority,
      relatedTo,
      relatedToId,
      relatedToType,
      attendees,
      outcome,
      nextSteps,
      remarks,
    } = body;

    if (!activityType) {
      return NextResponse.json(
        { success: false, error: "Activity type is required" },
        { status: 400 }
      );
    }

    if (!subject) {
      return NextResponse.json(
        { success: false, error: "Subject is required" },
        { status: 400 }
      );
    }

    if (!activityDate) {
      return NextResponse.json(
        { success: false, error: "Activity date is required" },
        { status: 400 }
      );
    }

    const data = await prisma.activity.create({
      data: {
        activityType,
        subject,
        description,
        activityDate: new Date(activityDate),
        startTime,
        endTime,
        duration,
        location,
        status: status || "Planned",
        priority: priority || "Normal",
        relatedTo,
        relatedToId,
        relatedToType,
        attendees,
        outcome,
        nextSteps,
        remarks,
        ownerId: user.id,
        createdById: user.id,
        createdByName: `${user.firstName} ${user.lastName}`,
      },
    });

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error("Error creating activity:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create activity" },
      { status: 500 }
    );
  }
}
