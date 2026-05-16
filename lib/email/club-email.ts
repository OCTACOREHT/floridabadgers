import fs from "node:fs";
import path from "node:path";
import nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer";

export const CLUB_NAME = "Florida Badgers FCA";
export const CLUB_ADDRESS = "1901 N. Seacrest Blvd, Boynton Beach FL 33435";
export const CLUB_PHONE_PRIMARY = "+1 914-426-1526";
export const CLUB_PHONE_SECONDARY = "+1 305-988-9700";
export const CLUB_EMAIL = "info@floridabadgersfca.com";

type ClubMailerContext = {
  transporter: nodemailer.Transporter;
  fromWithName: string;
  contactTo: string;
  registrationTo: string;
  logoHtml: string;
  attachments: Mail.Attachment[];
};

type BrandedEmailOptions = {
  logoHtml: string;
  bannerTitle: string;
  bannerSubtitle: string;
  greeting: string;
  contentHtml: string;
  referenceLabel?: string;
  referenceValue?: string;
  closingName?: string;
};

type PaymentReceiptEmailOptions = {
  logoHtml: string;
  receiptNumber: string;
  paymentId: string;
  generatedAt: string;
  playerName: string;
  parentName: string;
  parentPhone: string;
  registrationEmail: string;
  registrationPhone: string;
  description: string;
  method: string;
  status: string;
  paymentDate: string;
  amount: number;
};

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

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function lineBreaksToHtml(value: string): string {
  return escapeHtml(value).replaceAll("\n", "<br/>");
}

export function createClubMailerContext(): ClubMailerContext {
  const smtpHost = getRequiredEnv("SMTP_HOST");
  const smtpPort = parsePort(getRequiredEnv("SMTP_PORT"));
  const smtpUser = getRequiredEnv("SMTP_USER");
  const smtpPass = getRequiredEnv("SMTP_PASS");

  const contactTo = (process.env.CONTACT_TO_EMAIL ?? CLUB_EMAIL).trim();
  const registrationTo = (process.env.REGISTRATION_TO_EMAIL ?? contactTo).trim();
  const fromEmail = (process.env.CONTACT_FROM_EMAIL ?? smtpUser).trim();
  const fromWithName = `${CLUB_NAME} <${fromEmail}>`;

  const logoPath = path.join(process.cwd(), "public", "images", "Florida Badgers.png");
  const logoExists = fs.existsSync(logoPath);

  const attachments: Mail.Attachment[] = logoExists
    ? [
        {
          filename: "florida-badgers-logo.png",
          path: logoPath,
          cid: "club-logo",
          contentDisposition: "inline",
        },
      ]
    : [];

  const logoHtml = logoExists
    ? `<img src="cid:club-logo" alt="${CLUB_NAME}" width="94" height="94" style="display:block;width:94px;height:94px;object-fit:contain;" />`
    : `<div style="font-size:26px;font-weight:800;line-height:1.2;color:#111827;">${CLUB_NAME}</div>`;

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  return { transporter, fromWithName, contactTo, registrationTo, logoHtml, attachments };
}

export function renderClubBrandedEmail(options: BrandedEmailOptions): string {
  const hasSubtitle = options.bannerSubtitle.trim().length > 0;
  const referenceSection =
    options.referenceLabel && options.referenceValue
      ? `
        <p style="margin:18px 0 0 0;font-size:15px;line-height:1.4;color:#111827;">
          <strong>${escapeHtml(options.referenceLabel)}: ${escapeHtml(options.referenceValue)}</strong>
        </p>
      `
      : "";

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="x-apple-disable-message-reformatting" />
        <title>${CLUB_NAME}</title>
      </head>
      <body style="margin:0;padding:0;background:#f1f3f5;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f3f5;padding:18px 10px;">
          <tr>
            <td align="center">
              <table role="presentation" width="620" cellspacing="0" cellpadding="0" style="width:100%;max-width:620px;background:#ffffff;border:1px solid #d9d9d9;border-radius:16px;overflow:hidden;font-family:Arial,'Segoe UI',sans-serif;">
                <tr>
                  <td align="center" style="padding:26px 16px 18px;background:#ffffff;">
                    ${options.logoHtml}
                    <div style="margin-top:10px;font-size:28px;font-weight:800;line-height:1.1;color:#111827;text-transform:uppercase;letter-spacing:.02em;">
                      Florida Badgers FCA
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="height:4px;background:#000000;"></td>
                </tr>
                <tr>
                  <td align="center" style="padding:18px 24px;background:#B0B0B0;">
                    <h1 style="margin:0;font-size:22px;line-height:1.2;color:#111827;font-weight:800;">
                      ${escapeHtml(options.bannerTitle)}
                    </h1>
                    ${
                      hasSubtitle
                        ? `<p style="margin:8px 0 0 0;font-size:14px;line-height:1.45;color:#1f2937;">${escapeHtml(options.bannerSubtitle)}</p>`
                        : ""
                    }
                  </td>
                </tr>
                <tr>
                  <td style="padding:24px 26px 20px;color:#1f2937;">
                    <p style="margin:0 0 14px 0;font-size:16px;line-height:1.55;color:#111827;">
                      ${escapeHtml(options.greeting)}
                    </p>
                    ${referenceSection}
                    <div style="margin-top:14px;font-size:14px;line-height:1.6;color:#1f2937;">
                      ${options.contentHtml}
                    </div>
                    <p style="margin:20px 0 0 0;font-size:14px;line-height:1.6;color:#111827;">
                      Best regards,<br/>
                      ${escapeHtml(options.closingName ?? `${CLUB_NAME} Team`)}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:16px;background:#f7f7f7;border-top:1px solid #e5e7eb;">
                    <p style="margin:0;font-size:12px;line-height:1.6;color:#4b5563;">
                      ${CLUB_NAME} | ${CLUB_ADDRESS}<br/>
                      ${CLUB_PHONE_PRIMARY} | ${CLUB_PHONE_SECONDARY}<br/>
                      <a href="mailto:${CLUB_EMAIL}" style="color:#111827;text-decoration:none;">${CLUB_EMAIL}</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function formatMoney(value: number): string {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function renderPaymentReceiptEmail(options: PaymentReceiptEmailOptions): string {
  const safePlayerName = escapeHtml(options.playerName || "-");
  const safeParentName = escapeHtml(options.parentName || "-");
  const safeParentPhone = escapeHtml(options.parentPhone || "-");
  const safeRegistrationEmail = escapeHtml(options.registrationEmail || "-");
  const safeRegistrationPhone = escapeHtml(options.registrationPhone || "-");
  const safeMethod = escapeHtml(options.method || "-");
  const safeStatus = escapeHtml(options.status || "-");
  const safeDescription = escapeHtml(options.description || "Payment");
  const safePaymentDate = escapeHtml(options.paymentDate || "-");
  const safeGeneratedAt = escapeHtml(options.generatedAt || "-");
  const safeReceipt = escapeHtml(options.receiptNumber || "-");
  const safePaymentId = escapeHtml(options.paymentId || "-");
  const safeAmount = formatMoney(Number.isFinite(options.amount) ? options.amount : 0);

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="x-apple-disable-message-reformatting" />
        <title>${CLUB_NAME} - Payment Receipt</title>
      </head>
      <body style="margin:0;padding:0;background:#f1f3f5;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f3f5;padding:18px 10px;">
          <tr>
            <td align="center">
              <table role="presentation" width="760" cellspacing="0" cellpadding="0" style="width:100%;max-width:760px;background:#ffffff;border:1px solid #d9d9d9;font-family:Arial,'Segoe UI',sans-serif;">
                <tr>
                  <td style="padding:22px 24px 14px 24px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td valign="top" style="width:74px;padding-right:12px;">
                          ${options.logoHtml}
                        </td>
                        <td valign="top">
                          <div style="font-size:36px;font-weight:900;line-height:1.05;color:#111827;text-transform:uppercase;letter-spacing:.01em;">
                            ${CLUB_NAME}
                          </div>
                          <div style="margin-top:6px;font-size:13px;line-height:1.5;color:#6b7280;">
                            ${CLUB_ADDRESS}<br/>
                            ${CLUB_EMAIL} | ${CLUB_PHONE_PRIMARY}
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr><td style="height:1px;background:#d9d9d9;"></td></tr>
                <tr>
                  <td align="center" style="padding:14px 24px 8px 24px;">
                    <div style="font-size:24px;font-weight:900;line-height:1.15;color:#111827;text-transform:uppercase;">
                      Official Payment Receipt
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="right" style="padding:0 24px 10px 24px;">
                    <div style="font-size:13px;line-height:1.55;color:#111827;">
                      <strong>RECEIPT #:</strong> ${safeReceipt}<br/>
                      <strong>PAYMENT ID:</strong> ${safePaymentId}<br/>
                      <strong>GENERATED AT:</strong> ${safeGeneratedAt}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 24px 22px 24px;">
                    <div style="font-size:20px;font-weight:900;line-height:1.2;color:#111827;text-transform:uppercase;margin:0 0 10px 0;">
                      Player Details
                    </div>
                    <div style="font-size:14px;line-height:1.75;color:#111827;">
                      <strong>Player Name:</strong> ${safePlayerName}<br/>
                      <strong>Parent / Guardian:</strong> ${safeParentName}<br/>
                      <strong>Parent Phone:</strong> ${safeParentPhone}<br/>
                      <strong>Registration Email:</strong> ${safeRegistrationEmail}<br/>
                      <strong>Registration Phone:</strong> ${safeRegistrationPhone}
                    </div>

                    <div style="margin-top:16px;background:#808080;color:#ffffff;font-size:14px;font-weight:900;padding:7px 10px;text-transform:uppercase;">
                      Payment Details
                    </div>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:13px;color:#111827;">
                      <thead>
                        <tr style="background:#f3f4f6;">
                          <th align="left" style="border:1px solid #d9d9d9;padding:8px;">Description</th>
                          <th align="left" style="border:1px solid #d9d9d9;padding:8px;">Method</th>
                          <th align="left" style="border:1px solid #d9d9d9;padding:8px;">Status</th>
                          <th align="left" style="border:1px solid #d9d9d9;padding:8px;">Date</th>
                          <th align="right" style="border:1px solid #d9d9d9;padding:8px;">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style="border:1px solid #d9d9d9;padding:8px;">${safeDescription}</td>
                          <td style="border:1px solid #d9d9d9;padding:8px;">${safeMethod}</td>
                          <td style="border:1px solid #d9d9d9;padding:8px;">${safeStatus}</td>
                          <td style="border:1px solid #d9d9d9;padding:8px;">${safePaymentDate}</td>
                          <td align="right" style="border:1px solid #d9d9d9;padding:8px;font-weight:700;">${safeAmount}</td>
                        </tr>
                      </tbody>
                    </table>

                    <table role="presentation" width="300" cellspacing="0" cellpadding="0" style="margin-top:10px;margin-left:auto;border-collapse:collapse;font-size:13px;color:#111827;">
                      <tr>
                        <td style="border:1px solid #d9d9d9;padding:8px;background:#f9fafb;font-weight:700;">Subtotal</td>
                        <td align="right" style="border:1px solid #d9d9d9;padding:8px;font-weight:700;">${safeAmount}</td>
                      </tr>
                      <tr>
                        <td style="border:1px solid #d9d9d9;padding:8px;background:#f9fafb;font-weight:700;">Taxes</td>
                        <td align="right" style="border:1px solid #d9d9d9;padding:8px;font-weight:700;">$0.00</td>
                      </tr>
                      <tr>
                        <td style="border:1px solid #d9d9d9;padding:8px;background:#e5e7eb;font-weight:900;">Total Paid</td>
                        <td align="right" style="border:1px solid #d9d9d9;padding:8px;background:#e5e7eb;font-weight:900;">${safeAmount}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:14px 20px;background:#f7f7f7;border-top:1px solid #e5e7eb;">
                    <p style="margin:0;font-size:12px;line-height:1.6;color:#6b7280;">
                      Thank you for supporting ${CLUB_NAME}. This receipt confirms payment recorded in our system.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}
