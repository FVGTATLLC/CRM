// ICS Calendar File Generator
// Generates .ics files compatible with Google Calendar, Outlook, Apple Calendar

export interface MeetingEvent {
  subject: string;
  description?: string;
  location?: string;
  startDate: Date;
  endDate: Date;
  meetingLink?: string;
  attendees?: string; // comma-separated emails
  organizer?: string;
}

export function generateICSFile(event: MeetingEvent): string {
  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  };

  const uid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@gta-crm`;
  const now = formatDate(new Date());

  let description = event.description || "";
  if (event.meetingLink) {
    description += `\\n\\nJoin Meeting: ${event.meetingLink}`;
  }

  let location = event.location || "";
  if (event.meetingLink && !location) {
    location = event.meetingLink;
  }

  let ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FLYVENTO CRM//Meeting//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${formatDate(event.startDate)}`,
    `DTEND:${formatDate(event.endDate)}`,
    `SUMMARY:${event.subject}`,
  ];

  if (description) ics.push(`DESCRIPTION:${description.replace(/\n/g, "\\n")}`);
  if (location) ics.push(`LOCATION:${location}`);
  if (event.meetingLink) ics.push(`URL:${event.meetingLink}`);

  // Add attendees
  if (event.attendees) {
    const emails = event.attendees.split(",").map((e) => e.trim()).filter(Boolean);
    for (const email of emails) {
      ics.push(`ATTENDEE;RSVP=TRUE:mailto:${email}`);
    }
  }

  if (event.organizer) {
    ics.push(`ORGANIZER:mailto:${event.organizer}`);
  }

  ics.push("STATUS:CONFIRMED", "END:VEVENT", "END:VCALENDAR");
  return ics.join("\r\n");
}

export function downloadICSFile(event: MeetingEvent, filename?: string): void {
  const icsContent = generateICSFile(event);
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `${event.subject.replace(/[^a-zA-Z0-9]/g, "_")}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
