import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { createCalendarEvent, listCalendarEvents, isGoogleConnected } from "@/lib/google";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "status";

    if (action === "status") {
      const connected = await isGoogleConnected(user.id, prisma);
      return NextResponse.json({ success: true, connected });
    }

    if (action === "events") {
      const timeMin = searchParams.get("timeMin") || undefined;
      const timeMax = searchParams.get("timeMax") || undefined;
      const events = await listCalendarEvents(user.id, prisma, timeMin, timeMax);
      return NextResponse.json({ success: true, data: events });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Calendar API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { subject, description, location, startDateTime, endDateTime, attendees, withMeetLink } = body;

    if (!subject || !startDateTime || !endDateTime) {
      return NextResponse.json({ error: "Subject, start and end times are required" }, { status: 400 });
    }

    const event = {
      summary: subject,
      description,
      location,
      start: { dateTime: startDateTime, timeZone: "UTC" },
      end: { dateTime: endDateTime, timeZone: "UTC" },
      attendees: attendees ? attendees.split(",").map((e: string) => ({ email: e.trim() })) : undefined,
    };

    const result = await createCalendarEvent(user.id, prisma, event, withMeetLink !== false);

    if (!result) {
      return NextResponse.json({ error: "Google Calendar not connected. Please connect your Google account first." }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: "Calendar event created" + (result.meetLink ? " with Google Meet link" : ""),
    });
  } catch (error) {
    console.error("Calendar create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
