import { NextRequest, NextResponse } from "next/server";
import { trackSiteEvent } from "@/lib/analytics/events";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { verifyRecaptchaToken } from "@/lib/recaptcha";
import { enforceRateLimit, rejectCrossSiteRequest } from "@/lib/security/http-guard";
import {
  createClubMailerContext,
  escapeHtml,
  lineBreaksToHtml,
  renderClubBrandedEmail,
} from "@/lib/email/club-email";

export const runtime = "nodejs";

type ContactInput = {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  recaptchaToken?: string;
};

function asText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: NextRequest) {
  const crossSiteResponse = rejectCrossSiteRequest(request);
  if (crossSiteResponse) return crossSiteResponse;

  const limiterResponse = enforceRateLimit(request, {
    keyPrefix: "contact-form",
    limit: 8,
    windowMs: 10 * 60 * 1000,
  });
  if (limiterResponse) return limiterResponse;

  try {
    const body = (await request.json()) as ContactInput;

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

    const recaptchaToken = asText(body.recaptchaToken);
    const shouldEnforceRecaptcha =
      process.env.RECAPTCHA_SECRET_KEY?.trim() &&
      process.env.RECAPTCHA_ENFORCED !== "false";

    if (shouldEnforceRecaptcha) {
      const recaptcha = await verifyRecaptchaToken(recaptchaToken);
      if (!recaptcha.success) {
        return NextResponse.json(
          { error: recaptcha.error ?? "Invalid reCAPTCHA verification." },
          { status: 400 }
        );
      }
    }

    const supabase = createSupabaseServiceClient();
    const { data: storedMessage, error: storeError } = await supabase
      .from("contact_messages")
      .insert({
        full_name: name,
        email,
        subject,
        message,
        status: "new",
      })
      .select("id")
      .single();

    if (storeError) {
      throw new Error(`Unable to save contact message: ${storeError.message}`);
    }

    const mailer = createClubMailerContext();
    const messageRef =
      typeof storedMessage?.id === "string" && storedMessage.id.length > 0
        ? storedMessage.id.slice(0, 8).toUpperCase()
        : new Date().toISOString().replaceAll(/[-:TZ.]/g, "").slice(0, 12);

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
    const notifyHtml = renderClubBrandedEmail({
      logoHtml: mailer.logoHtml,
      bannerTitle: "Contact Request Received",
      bannerSubtitle: "A new message has been submitted on the website.",
      greeting: "Hello Florida Badgers Team,",
      contentHtml: `
        <p style="margin:0 0 14px 0;">
          A new message has been submitted via the contact form.
        </p>
        <p style="margin:0 0 14px 0;">
          <strong>From:</strong> ${escapeHtml(name)} (${escapeHtml(email)})
        </p>
        <p style="margin:0 0 14px 0;">
          <strong>Subject:</strong> ${escapeHtml(subject)}
        </p>
        <p style="margin:0 0 8px 0;"><strong>Message:</strong></p>
        <div style="padding:12px;border:1px solid #d9d9d9;background:#f9fafb;color:#111827;">
          ${lineBreaksToHtml(message)}
        </div>
      `,
    });

    await mailer.transporter.sendMail({
      from: mailer.fromWithName,
      to: mailer.contactTo,
      replyTo: email,
      subject: notifySubject,
      text: notifyText,
      html: notifyHtml,
      attachments: mailer.attachments,
    });

    const ackText = [
      "Application Received",
      "",
      `Hello ${name},`,
      "",
      "We have successfully received your message.",
      "",
      "Our team will review your request and get back to you shortly.",
      "",
      "Florida Badgers FCA Team",
    ].join("\n");
    const ackHtml = renderClubBrandedEmail({
      logoHtml: mailer.logoHtml,
      bannerTitle: "Message Received",
      bannerSubtitle: "",
      greeting: `Hello ${name},`,
      contentHtml: `
        <p style="margin:0 0 14px 0;">
          We have successfully received your message and our team will respond shortly.
        </p>
      `,
    });

    await mailer.transporter.sendMail({
      from: mailer.fromWithName,
      to: email,
      subject: `Message Received - Florida Badgers FCA [${messageRef}]`,
      text: ackText,
      html: ackHtml,
      attachments: mailer.attachments,
    });

    await trackSiteEvent({
      eventType: "contact_submitted",
      path: "/contacts",
      source: "contact-api",
      metadata: {
        subject,
        contactEmail: email,
        contactMessageId: storedMessage?.id ?? null,
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
