import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { createZohoMeeting, listZohoMeetings, isZohoConnected } from "@/lib/zoho";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "status";

    if (action === "status") {
      const connected = await isZohoConnected(user.id, prisma);
      return NextResponse.json({ success: true, connected });
    }

    if (action === "list") {
      const meetings = await listZohoMeetings(user.id, prisma);
      return NextResponse.json({ success: true, data: meetings });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Zoho Meeting API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { topic, agenda, startTime, duration, timezone, attendees } = body;

    if (!topic || !startTime) {
      return NextResponse.json({ error: "Topic and start time are required" }, { status: 400 });
    }

    const participants = attendees
      ? attendees.split(",").map((e: string) => ({ email: e.trim() })).filter((p: any) => p.email)
      : [];

    const result = await createZohoMeeting(user.id, prisma, {
      topic,
      agenda,
      startTime,
      duration: duration || 60,
      timezone: timezone || "UTC",
      participants,
    });

    if (!result) {
      return NextResponse.json({ error: "Zoho Meeting not connected. Please connect your Zoho account first." }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: "Zoho Meeting created successfully",
    });
  } catch (error) {
    console.error("Zoho Meeting create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
