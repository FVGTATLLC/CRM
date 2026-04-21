// Zoho Meeting API Integration

const ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID || "";
const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET || "";
const ZOHO_REDIRECT_URI = process.env.ZOHO_REDIRECT_URI || "";
const ZOHO_DOMAIN = process.env.ZOHO_DOMAIN || "zoho.com";

const ZOHO_AUTH_URL = `https://accounts.${ZOHO_DOMAIN}/oauth/v2`;
const ZOHO_MEETING_API = `https://meeting.${ZOHO_DOMAIN}/api/v2`;

const SCOPES = [
  "ZohoMeeting.meeting.CREATE",
  "ZohoMeeting.meeting.READ",
  "ZohoMeeting.meeting.UPDATE",
  "ZohoMeeting.meeting.DELETE",
].join(",");

export function getZohoAuthUrl(state?: string): string {
  const params = new URLSearchParams({
    client_id: ZOHO_CLIENT_ID,
    redirect_uri: ZOHO_REDIRECT_URI,
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
    ...(state ? { state } : {}),
  });
  return `${ZOHO_AUTH_URL}/auth?${params}`;
}

export async function exchangeZohoCode(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const res = await fetch(`${ZOHO_AUTH_URL}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: ZOHO_CLIENT_ID,
      client_secret: ZOHO_CLIENT_SECRET,
      redirect_uri: ZOHO_REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Zoho token exchange failed: ${JSON.stringify(err)}`);
  }
  return res.json();
}

export async function refreshZohoToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const res = await fetch(`${ZOHO_AUTH_URL}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: ZOHO_CLIENT_ID,
      client_secret: ZOHO_CLIENT_SECRET,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error("Failed to refresh Zoho token");
  return res.json();
}

async function getValidZohoToken(userId: string, prisma: any): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { zohoAccessToken: true, zohoRefreshToken: true, zohoTokenExpiry: true },
  });
  if (!user?.zohoRefreshToken) return null;

  if (user.zohoTokenExpiry && new Date(user.zohoTokenExpiry) > new Date(Date.now() + 5 * 60 * 1000)) {
    return user.zohoAccessToken;
  }

  try {
    const tokens = await refreshZohoToken(user.zohoRefreshToken);
    await prisma.user.update({
      where: { id: userId },
      data: {
        zohoAccessToken: tokens.access_token,
        zohoTokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
      },
    });
    return tokens.access_token;
  } catch {
    return null;
  }
}

export interface ZohoMeetingData {
  topic: string;
  agenda?: string;
  startTime: string; // ISO format
  duration: number; // minutes
  timezone?: string;
  participants?: { email: string }[];
}

export async function createZohoMeeting(
  userId: string,
  prisma: any,
  meeting: ZohoMeetingData
): Promise<{ meetingKey: string; meetingLink: string; startUrl: string } | null> {
  const token = await getValidZohoToken(userId, prisma);
  if (!token) return null;

  // Format start time for Zoho: "MMM dd, yyyy hh:mm aa"
  const d = new Date(meeting.startTime);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const month = months[d.getMonth()];
  const day = String(d.getDate()).padStart(2, "0");
  const year = d.getFullYear();
  const hours = d.getHours() % 12 || 12;
  const mins = String(d.getMinutes()).padStart(2, "0");
  const ampm = d.getHours() >= 12 ? "PM" : "AM";
  const zohoStartTime = `${month} ${day}, ${year} ${String(hours).padStart(2,"0")}:${mins} ${ampm}`;

  const body: any = {
    session: {
      topic: meeting.topic,
      agenda: meeting.agenda || "",
      presenter: parseInt(ZOHO_CLIENT_ID.split(".")[0]) || 0,
      startTime: zohoStartTime,
      duration: meeting.duration,
      timezone: meeting.timezone || "UTC",
    },
  };

  if (meeting.participants && meeting.participants.length > 0) {
    body.session.participants = meeting.participants.map((p) => ({
      email: p.email,
    }));
  }

  const res = await fetch(`${ZOHO_MEETING_API}/sessions.json`, {
    method: "POST",
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Zoho Meeting API error:", err);
    return null;
  }

  const data = await res.json();
  const session = data.session || data;

  return {
    meetingKey: session.meetingKey || session.session_id || "",
    meetingLink: session.joinUrl || session.join_url || "",
    startUrl: session.startUrl || session.start_url || "",
  };
}

export async function listZohoMeetings(
  userId: string,
  prisma: any
): Promise<any[]> {
  const token = await getValidZohoToken(userId, prisma);
  if (!token) return [];

  const res = await fetch(`${ZOHO_MEETING_API}/sessions.json`, {
    headers: { Authorization: `Zoho-oauthtoken ${token}` },
  });

  if (!res.ok) return [];
  const data = await res.json();
  return data.session || [];
}

export async function isZohoConnected(userId: string, prisma: any): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { zohoRefreshToken: true },
  });
  return !!user?.zohoRefreshToken;
}
