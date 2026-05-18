import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { getAuthenticatedUserFromRequest } from "@/lib/auth/session";
import { requireApiUser, requireApiUserWithUser } from "@/lib/auth/api-guard";
import {
  enrichPaymentRowsWithRegistrationDetails,
  getDashboardTableConfig,
  getDashboardTableRows,
  normalizeTablePayload,
} from "@/lib/dashboard/tables";
import { resolveArticleAuthorId } from "@/lib/dashboard/article-author";
import {
  createClubMailerContext,
  renderPaymentReceiptEmail,
} from "@/lib/email/club-email";
import { canAccessDashboardTable, normalizeDashboardRole } from "@/lib/auth/permissions";

export const runtime = "nodejs";

function parseLimit(value: string | null): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed)) return 80;
  return Math.max(1, Math.min(parsed, 300));
}

function asText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPaymentDate(value: unknown): string {
  const text = asText(value);
  if (!text) return "-";
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatPaymentMethod(value: unknown): string {
  const normalized = asText(value).toLowerCase();
  if (!normalized) return "-";
  const labels: Record<string, string> = {
    zelle: "Zelle",
    cash: "Cash",
    transfer: "Bank Transfer",
    card: "Card",
    check: "Check",
  };
  return labels[normalized] ?? normalized;
}

function formatPaymentStatus(value: unknown): string {
  const normalized = asText(value).toLowerCase();
  if (!normalized) return "-";
  const labels: Record<string, string> = {
    paid: "Paid",
    pending: "Pending",
    cancelled: "Cancelled",
  };
  return labels[normalized] ?? normalized;
}

function formatFeeType(value: unknown): string {
  const normalized = asText(value).toLowerCase();
  if (!normalized) return "Payment";
  const labels: Record<string, string> = {
    registration: "Registration Fee",
    monthly: "Monthly Fee",
    equipment: "Equipment Fee",
    other: "Custom Payment",
  };
  return labels[normalized] ?? normalized;
}

function parseBundleInfo(notes: string): { current: number; total: number } | null {
  const match = notes.match(/bundle payment\s*\((\d+)\s*\/\s*(\d+)\)/i);
  if (!match) return null;

  const current = Number.parseInt(match[1] ?? "", 10);
  const total = Number.parseInt(match[2] ?? "", 10);
  if (!Number.isFinite(current) || !Number.isFinite(total) || current <= 0 || total <= 0) {
    return null;
  }
  return { current, total };
}

function getPlayerNameFromPaymentRow(row: Record<string, unknown>): string {
  const registrationName = asText(row.registration_player_name);
  if (registrationName) return registrationName;

  const relation = row.joueurs;
  const source =
    Array.isArray(relation) ? relation.find((item) => item && typeof item === "object") : relation;

  if (source && typeof source === "object") {
    const prenom = asText((source as Record<string, unknown>).prenom);
    const nom = asText((source as Record<string, unknown>).nom);
    const fullName = `${prenom} ${nom}`.trim();
    if (fullName) return fullName;
  }

  return "Player";
}

async function sendPaymentReceiptEmail(
  supabase: ReturnType<typeof createSupabaseServiceClient>,
  paymentRow: Record<string, unknown>
): Promise<void> {
  const receiver = asText(paymentRow.registration_email);
  if (!isEmail(receiver)) return;

  const paymentId = asText(paymentRow.id);
  if (!paymentId) return;

  const receiptNumber = `FBCA-RCPT-${paymentId.slice(0, 8).toUpperCase()}`;
  const generatedAt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());

  let playerName = getPlayerNameFromPaymentRow(paymentRow);
  if (playerName === "Player") {
    const playerId = asText(paymentRow.joueur_id);
    if (playerId) {
      const { data: player } = await supabase
        .from("joueurs")
        .select("prenom, nom")
        .eq("id", playerId)
        .maybeSingle();
      const prenom = asText(player?.prenom);
      const nom = asText(player?.nom);
      const fullName = `${prenom} ${nom}`.trim();
      if (fullName) playerName = fullName;
    }
  }

  const notes = asText(paymentRow.notes);
  const bundleInfo = parseBundleInfo(notes);
  if (bundleInfo && bundleInfo.current < bundleInfo.total) {
    return;
  }

  const amount = Number(paymentRow.montant ?? 0);
  let safeAmount = Number.isFinite(amount) ? amount : 0;
  const method = formatPaymentMethod(paymentRow.methode_paiement);
  const status = formatPaymentStatus(paymentRow.statut);
  let description = formatFeeType(paymentRow.type_frais);
  const paymentDate = formatPaymentDate(paymentRow.date_paiement);

  if (bundleInfo && bundleInfo.current === bundleInfo.total) {
    const playerId = asText(paymentRow.joueur_id);
    const paymentDateRaw = asText(paymentRow.date_paiement);
    if (playerId && paymentDateRaw) {
      const bundlePattern = `%Bundle payment (%/${bundleInfo.total})%`;
      const { data: bundleRows } = await supabase
        .from("paiements")
        .select("montant")
        .eq("joueur_id", playerId)
        .eq("date_paiement", paymentDateRaw)
        .like("notes", bundlePattern)
        .limit(20);

      const bundleTotal = (bundleRows ?? []).reduce((sum, row) => {
        const lineAmount = Number((row as { montant?: unknown }).montant ?? 0);
        return sum + (Number.isFinite(lineAmount) ? lineAmount : 0);
      }, 0);
      if (bundleTotal > 0) {
        safeAmount = bundleTotal;
      }
    }
    description = "Registration + Monthly Bundle";
  }

  const mailer = createClubMailerContext();
  const html = renderPaymentReceiptEmail({
    logoHtml: mailer.logoHtml,
    receiptNumber,
    paymentId,
    generatedAt,
    playerName,
    parentName: asText(paymentRow.parent_name) || "-",
    parentPhone: asText(paymentRow.parent_phone) || "-",
    registrationEmail: receiver || "-",
    registrationPhone: asText(paymentRow.registration_phone) || "-",
    description,
    method,
    status,
    paymentDate,
    amount: safeAmount,
  });

  const text = [
    "Payment Receipt",
    "",
    `Receipt #: ${receiptNumber}`,
    `Payment ID: ${paymentId}`,
    `Player: ${playerName}`,
    `Description: ${description}`,
    `Method: ${method}`,
    `Status: ${status}`,
    `Payment Date: ${paymentDate}`,
    `Amount: ${formatCurrency(safeAmount)}`,
  ].join("\n");

  await mailer.transporter.sendMail({
    from: mailer.fromWithName,
    to: receiver,
    subject: `Payment Receipt - ${receiptNumber}`,
    text,
    html,
    attachments: mailer.attachments,
  });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ table: string }> }
) {
  const guardResponse = await requireApiUser(request);
  if (guardResponse) return guardResponse;

  const { table } = await context.params;
  const config = getDashboardTableConfig(table);
  if (!config) {
    return NextResponse.json({ error: "Unsupported table." }, { status: 404 });
  }

  const user = await getAuthenticatedUserFromRequest(request);
  const role = normalizeDashboardRole(user?.role);
  if (!canAccessDashboardTable(role, table)) {
    return NextResponse.json({ error: "Forbidden: Unauthorized role." }, { status: 403 });
  }

  const startedAt = Date.now();
  try {
    const limit = parseLimit(request.nextUrl.searchParams.get("limit"));
    const data = await getDashboardTableRows(table, limit);
    const durationMs = Date.now() - startedAt;
    if (durationMs > 800) {
      console.info(`[dashboard][tables][GET] table=${table} limit=${limit} rows=${data.length} duration_ms=${durationMs}`);
    }
    return NextResponse.json({ table, config, data }, { status: 200 });
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    console.error(`[dashboard][tables][GET] table=${table} failed duration_ms=${durationMs}`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ table: string }> }
) {
  const auth = await requireApiUserWithUser(request);
  if (auth.response) return auth.response;
  const authenticatedUser = auth.user;

  const { table } = await context.params;
  const config = getDashboardTableConfig(table);
  if (!config) {
    return NextResponse.json({ error: "Unsupported table." }, { status: 404 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    
    const role = normalizeDashboardRole(authenticatedUser?.role);
    const isAdmin = role === "admin";

    if (!canAccessDashboardTable(role, table)) {
      return NextResponse.json({ error: "Forbidden: Unauthorized role." }, { status: 403 });
    }

    // Security: Non-admins can only create/edit THEIR OWN user record
    if (table === "users" && !isAdmin) {
       // In POST (create), we generally don't allow non-admins to create users anyway
       if (request.method === "POST") {
          return NextResponse.json({ error: "Only admins can create new users." }, { status: 403 });
       }
    }

    const payload = normalizeTablePayload(table, body, "create");
    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: "No valid fields supplied." }, { status: 400 });
    }

    // Custom logic for users table (Supabase Auth integration)
    if (table === "users") {
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "").trim();
      const confirmPassword = String(body.confirm_password || "").trim();

      if (!email) {
        return NextResponse.json({ error: "Email is required." }, { status: 400 });
      }
      if (!password) {
        return NextResponse.json({ error: "Password is required." }, { status: 400 });
      }
      if (password !== confirmPassword) {
        return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
      }

      const supabase = createSupabaseServiceClient();
      
      // 1. Create the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: payload.full_name,
          role: payload.role
        }
      });

      if (authError) {
        return NextResponse.json({ error: `Auth Error: ${authError.message}` }, { status: 400 });
      }

      const authUser = authData.user;
      if (!authUser) {
        return NextResponse.json({ error: "Failed to create auth user." }, { status: 400 });
      }

      // 2. Set the ID of the public user to match the Auth user
      payload.id = authUser.id;

      // Remove transient fields
      for (const field of config.createFields) {
        if (field.transient) {
          delete payload[field.key];
        }
      }

      // 3. Create the record in the public users table
      const { data: userData, error: userError } = await supabase
        .from(config.table)
        .insert(payload)
        .select("*")
        .single();

      if (userError) {
        // Cleanup: try to delete the auth user if the public record fails?
        // For now, just report the error.
        return NextResponse.json({ error: `Database Error: ${userError.message}` }, { status: 400 });
      }

      return NextResponse.json({ data: userData }, { status: 201 });
    }

    const supabase = createSupabaseServiceClient();
    if (table === "actualites" && payload.is_published === true) {
      payload.auteur_id = await resolveArticleAuthorId(supabase, authenticatedUser.email);
    }

    const { data, error } = await supabase
      .from(config.table)
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Don't return password in response
    if (data && typeof data === "object" && "password" in data) {
      delete (data as Record<string, unknown>).password;
    }

    if (table === "paiements") {
      const [enrichedRow] = await enrichPaymentRowsWithRegistrationDetails(supabase, [data as Record<string, unknown>]);
      const paymentRow = (enrichedRow ?? data) as Record<string, unknown>;

      try {
        await sendPaymentReceiptEmail(supabase, paymentRow);
      } catch (mailError) {
        console.error("[payment-receipt-email] Failed to send receipt email", mailError);
      }

      return NextResponse.json({ data: paymentRow }, { status: 201 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected server error" },
      { status: 500 }
    );
  }
}
