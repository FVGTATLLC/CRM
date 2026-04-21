// Google Calendar + Meet API Integration

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
].join(" ");

export function getGoogleAuthUrl(state?: string): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
    ...(state ? { state } : {}),
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Google token exchange failed: ${err.error_description || err.error}`);
  }
  return res.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error("Failed to refresh Google token");
  return res.json();
}

async function getValidToken(userId: string, prisma: any): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { googleAccessToken: true, googleRefreshToken: true, googleTokenExpiry: true },
  });
  if (!user?.googleRefreshToken) return null;

  // Check if token is expired (with 5 min buffer)
  if (user.googleTokenExpiry && new Date(user.googleTokenExpiry) > new Date(Date.now() + 5 * 60 * 1000)) {
    return user.googleAccessToken;
  }

  // Refresh the token
  try {
    const tokens = await refreshAccessToken(user.googleRefreshToken);
    await prisma.user.update({
      where: { id: userId },
      data: {
        googleAccessToken: tokens.access_token,
        googleTokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
      },
    });
    return tokens.access_token;
  } catch {
    return null;
  }
}

export interface GoogleCalendarEvent {
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime: string; timeZone?: string };
  end: { dateTime: string; timeZone?: string };
  attendees?: { email: string }[];
  conferenceData?: any;
}

export async function createCalendarEvent(
  userId: string,
  prisma: any,
  event: GoogleCalendarEvent,
  withMeetLink: boolean = true
): Promise<{ eventId: string; meetLink?: string; htmlLink: string } | null> {
  const token = await getValidToken(userId, prisma);
  if (!token) return null;

  const url = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
  if (withMeetLink) {
    url.searchParams.set("conferenceDataVersion", "1");
    event.conferenceData = {
      createRequest: {
        requestId: `gta-crm-${Date.now()}`,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    };
  }

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(event),
  });

  if (!res.ok) {
    const err = await res.json();
    console.error("Google Calendar API error:", err);
    return null;
  }

  const data = await res.json();
  return {
    eventId: data.id,
    meetLink: data.conferenceData?.entryPoints?.find((e: any) => e.entryPointType === "video")?.uri || data.hangoutLink,
    htmlLink: data.htmlLink,
  };
}

export async function listCalendarEvents(
  userId: string,
  prisma: any,
  timeMin?: string,
  timeMax?: string,
  maxResults: number = 20
): Promise<any[]> {
  const token = await getValidToken(userId, prisma);
  if (!token) return [];

  const params = new URLSearchParams({
    maxResults: maxResults.toString(),
    singleEvents: "true",
    orderBy: "startTime",
    ...(timeMin ? { timeMin } : { timeMin: new Date().toISOString() }),
    ...(timeMax ? { timeMax } : {}),
  });

  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return [];
  const data = await res.json();
  return data.items || [];
}

export async function isGoogleConnected(userId: string, prisma: any): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { googleRefreshToken: true },
  });
  return !!user?.googleRefreshToken;
}
