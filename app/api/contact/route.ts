import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import fs from "node:fs";
import path from "node:path";
import { trackSiteEvent } from "@/lib/analytics/events";
import { verifyRecaptchaToken } from "@/lib/recaptcha";

export const runtime = "nodejs";

type ContactInput = {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  captchaToken?: string;
};

function asText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

function parsePort(value: string): number {
  const port = Number.parseInt(value, 10);
  if (!Number.isFinite(port) || port <= 0) {
    throw new Error("Invalid SMTP_PORT value.");
  }
  return port;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function lineBreaksToHtml(value: string): string {
  return escapeHtml(value).replaceAll("\n", "<br/>");
}

const CLUB_NAME = "Florida Badgers FCA";
const CLUB_ADDRESS = "1901 N. Seacrest Blvd, Boynton Beach FL 33435";
const CLUB_PHONE_PRIMARY = "+1 914-426-1526";
const CLUB_PHONE_SECONDARY = "+1 305-988-9700";
const CLUB_EMAIL = "info@floridabadgersfca.com";

function renderEmailDocument(innerHtml: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="x-apple-disable-message-reformatting" />
        <title>${CLUB_NAME}</title>
      </head>
      <body style="margin:0;padding:0;background:#edf3fb;">
        ${innerHtml}
      </body>
    </html>
  `;
}

function renderClubContactSection(theme: "dark" | "light"): string {
  const dividerColor = theme === "dark" ? "rgba(255,255,255,0.12)" : "#e2e8f0";
  const textColor = theme === "dark" ? "#d8e3f2" : "#334155";
  const headingColor = theme === "dark" ? "#f8fafc" : "#0f172a";
  const emailColor = theme === "dark" ? "#bfdbfe" : "#1d4ed8";

  return `
    <div style="margin-top:22px;padding-top:16px;border-top:1px solid ${dividerColor};text-align:center;">
      <div style="font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${headingColor};margin-bottom:12px;">
        Contact Information
      </div>
      <div style="display:block;text-align:center;font-size:14px;line-height:1.8;color:${textColor};">
        <div><strong>Address:</strong> ${CLUB_ADDRESS}</div>
        <div><strong>Phone:</strong> ${CLUB_PHONE_PRIMARY}  ${CLUB_PHONE_SECONDARY}</div>
        <div><strong>Email:</strong> <a href="mailto:${CLUB_EMAIL}" style="color:${emailColor};text-decoration:none;">${CLUB_EMAIL}</a></div>
      </div>
    </div>
  `;
}

function renderEmailCard(params: {
  logoHtml: string;
  eyebrow: string;
  title: string;
  introHtml: string;
  contentHtml: string;
  theme?: "dark" | "light";
}): string {
  const theme = params.theme ?? "light";
  const wrapperBg = theme === "dark" ? "#203a5f" : "#ffffff";
  const wrapperBorder = theme === "dark" ? "#324a70" : "#dbe3ef";
  const bodyBg = theme === "dark" ? "#20324d" : "#ffffff";
  const bodyText = theme === "dark" ? "#d8e3f2" : "#334155";
  const titleText = theme === "dark" ? "#ffffff" : "#0f172a";
  const headerBg = "#29456b";

  return renderEmailDocument(`
    <div style="background:#eef3fb;padding:12px 8px;">
      <div style="max-width:560px;margin:0 auto;background:${wrapperBg};border:1px solid ${wrapperBorder};border-radius:12px;overflow:hidden;font-family:Arial,'Segoe UI',sans-serif;box-shadow:0 10px 24px rgba(15,23,42,0.08);">
        <div style="background:${headerBg};padding:16px 16px;color:#ffffff;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td style="width:62px;vertical-align:middle;">${params.logoHtml}</td>
              <td style="vertical-align:middle;padding-left:10px;">
                <div style="font-size:18px;font-weight:700;line-height:1.2;color:#ffffff;">${CLUB_NAME}</div>
                <div style="font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#ffffff;margin-top:4px;">${params.eyebrow}</div>
              </td>
            </tr>
          </table>
        </div>
        <div style="background:${bodyBg};padding:18px 16px;color:${bodyText};">
          <div style="font-size:20px;font-weight:800;line-height:1.2;color:${titleText};margin:0 0 8px 0;">
            ${params.title}
          </div>
          <div style="font-size:15px;line-height:1.5;color:${bodyText};margin-bottom:12px;">
            ${params.introHtml}
          </div>
          ${params.contentHtml}
          ${renderClubContactSection(theme)}
        </div>
      </div>
    </div>
  `);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ContactInput;

    const captchaResult = await verifyRecaptchaToken(body.captchaToken);
    if (!captchaResult.success) {
      return NextResponse.json({ error: captchaResult.error || "CAPTCHA verification failed." }, { status: 403 });
    }

    const name = asText(body.name);
    const email = asText(body.email);
    const subject = asText(body.subject);
    const message = asText(body.message);

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    if (!isEmail(email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    if (message.length < 5) {
      return NextResponse.json({ error: "Message is too short." }, { status: 400 });
    }

    if (message.length > 5000) {
      return NextResponse.json({ error: "Message is too long." }, { status: 400 });
    }

    const smtpHost = getRequiredEnv("SMTP_HOST");
    const smtpPort = parsePort(getRequiredEnv("SMTP_PORT"));
    const smtpUser = getRequiredEnv("SMTP_USER");
    const smtpPass = getRequiredEnv("SMTP_PASS");
    const contactTo = (process.env.CONTACT_TO_EMAIL ?? "info@floridabadgersfca.com").trim();
    const contactFrom = (process.env.CONTACT_FROM_EMAIL ?? smtpUser).trim();
    const fromWithName = `Florida Badgers FCA <${contactFrom}>`;
    const logoPath = path.join(process.cwd(), "public", "images", "Florida Badgers.png");
    const logoExists = fs.existsSync(logoPath);

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const attachments = logoExists
      ? [
          {
            filename: "florida-badgers-logo.png",
            path: logoPath,
            cid: "club-logo",
            contentDisposition: "inline" as const,
          },
        ]
      : [];

    const logoHtml = logoExists
      ? `<img src="cid:club-logo" alt="${CLUB_NAME}" width="56" height="56" style="display:block;width:56px;height:56px;object-fit:contain;" />`
      : `<div style="font-size:16px;font-weight:700;line-height:1.2;color:#ffffff;">${CLUB_NAME}</div>`;
    const messageRef = new Date().toISOString().replaceAll(/[-:TZ.]/g, "").slice(0, 12);
    const notifySubject = `[Contact ${messageRef}] ${subject}`;
    const notifyText = [
      "New contact form message",
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      `Subject: ${subject}`,
      "",
      "Message:",
      message,
    ].join("\n");
    const notifyHtml = renderEmailCard({
      logoHtml,
      eyebrow: "New Contact Message",
      title: "A new website message just arrived.",
      introHtml: `You have received a new message from <strong>${escapeHtml(name)}</strong> regarding <strong>${escapeHtml(subject)}</strong>.`,
      contentHtml: `
        <div style="font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#64748b;margin-bottom:8px;">From</div>
        <div style="font-size:15px;line-height:1.5;color:#0f172a;margin:0 0 12px 0;">${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</div>
        <div style="font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#64748b;margin-bottom:8px;">Message</div>
        <div style="margin-top:0;font-size:14px;line-height:1.55;color:#0f172a;word-break:break-word;">
          ${lineBreaksToHtml(message)}
        </div>
      `,
    });

    await transporter.sendMail({
      from: fromWithName,
      to: contactTo,
      replyTo: email,
      subject: notifySubject,
      text: notifyText,
      html: notifyHtml,
      attachments,
    });

    const ackText = [
      "Your message was delivered successfully.",
      "We will get back to you shortly.",
      "",
      "Florida Badgers FCA",
      CLUB_ADDRESS,
      `Phone: ${CLUB_PHONE_PRIMARY}  ${CLUB_PHONE_SECONDARY}`,
      `Email: ${CLUB_EMAIL}`,
    ].join("\n");
    const ackHtml = renderEmailCard({
      logoHtml,
      eyebrow: "Message Received",
      title: "Your message was delivered successfully.",
      introHtml: `Thank you for contacting us, <strong>${escapeHtml(name)}</strong>. We will get back to you shortly.`,
      contentHtml: `
        <div style="font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#64748b;margin-bottom:8px;">Your Submitted Message</div>
        <div style="font-size:14px;line-height:1.55;color:#1e293b;word-break:break-word;">
          ${lineBreaksToHtml(message)}
        </div>
      `,
    });

    await transporter.sendMail({
      from: fromWithName,
      to: email,
      subject: `Message Delivered - Florida Badgers FCA [${messageRef}]`,
      text: ackText,
      html: ackHtml,
      attachments,
    });

    await trackSiteEvent({
      eventType: "contact_submitted",
      path: "/contacts",
      source: "contact-api",
      metadata: {
        subject,
        contactEmail: email,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Your message was delivered successfully. We will get back to you shortly.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Contact form send failed:", error);
    return NextResponse.json(
      { error: "Unable to deliver message at this time. Please try again later." },
      { status: 500 }
    );
  }
}
