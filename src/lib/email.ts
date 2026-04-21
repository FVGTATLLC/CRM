// Email notification infrastructure
// Configure via env vars: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM

const SMTP_CONFIGURED = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!SMTP_CONFIGURED) {
    console.log(`[Email] SMTP not configured. Would have sent to ${options.to}: ${options.subject}`);
    return false;
  }

  try {
    // Use fetch to call an email API endpoint or external service
    // For now, log the email details. Replace with actual email service (SendGrid, Resend, etc.) when ready.
    console.log(`[Email] Sending to ${options.to}: ${options.subject}`);
    console.log(`[Email] SMTP Host: ${process.env.SMTP_HOST}`);
    // TODO: Integrate with email service (e.g., SendGrid, Resend, AWS SES)
    // Example with fetch:
    // await fetch("https://api.sendgrid.com/v3/mail/send", { method: "POST", headers: { Authorization: `Bearer ${process.env.SENDGRID_API_KEY}` }, body: JSON.stringify(...) });
    return true;
  } catch (error) {
    console.error("[Email] Failed to send:", error);
    return false;
  }
}

export async function sendLeadNotification(type: "new" | "assigned" | "statusChanged", data: { leadName: string; recipientEmail: string; details?: string }) {
  const subjects: Record<string, string> = {
    new: `New Lead: ${data.leadName}`,
    assigned: `Lead Assigned: ${data.leadName}`,
    statusChanged: `Lead Status Updated: ${data.leadName}`,
  };

  return sendEmail({
    to: data.recipientEmail,
    subject: subjects[type],
    html: `<h2>${subjects[type]}</h2><p>${data.details || "Please check the CRM for details."}</p>`,
  });
}

export async function sendAccountNotification(recipientEmail: string, accountName: string, action: string) {
  return sendEmail({
    to: recipientEmail,
    subject: `Account ${action}: ${accountName}`,
    html: `<h2>Account ${action}</h2><p>Account "${accountName}" has been ${action.toLowerCase()}. Please check the CRM for details.</p>`,
  });
}

export async function sendContactNotification(recipientEmail: string, contactName: string, action: string) {
  return sendEmail({
    to: recipientEmail,
    subject: `Contact ${action}: ${contactName}`,
    html: `<h2>Contact ${action}</h2><p>Contact "${contactName}" has been ${action.toLowerCase()}. Please check the CRM for details.</p>`,
  });
}
