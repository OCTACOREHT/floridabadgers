import { createSupabaseServiceClient } from "@/lib/supabase/server";

export type SiteEventType =
  | "page_view"
  | "registration_submitted"
  | "contact_submitted";

function isMissingTableError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === "42P01") return true;
  if (typeof error.code === "string" && error.code.toUpperCase().startsWith("PGRST")) {
    const postgrestMessage = (error.message ?? "").toLowerCase();
    if (postgrestMessage.includes("schema cache") || postgrestMessage.includes("could not find the table")) {
      return true;
    }
  }
  const message = (error.message ?? "").toLowerCase();
  return (
    message.includes("does not exist") ||
    message.includes("relation") ||
    message.includes("schema cache") ||
    message.includes("could not find the table")
  );
}

export async function trackSiteEvent(input: {
  eventType: SiteEventType;
  path: string;
  source?: string;
  metadata?: Record<string, unknown>;
  eventValue?: number;
}) {
  try {
    const normalizedPath = input.path.trim();
    if (!normalizedPath) return;

    const supabase = createSupabaseServiceClient();
    const { error } = await supabase.from("site_events").insert({
      event_type: input.eventType,
      path: normalizedPath,
      source: input.source?.trim() || "web",
      event_value: input.eventValue && input.eventValue > 0 ? input.eventValue : 1,
      metadata: input.metadata ?? {},
    });

    if (error && !isMissingTableError(error)) {
      console.error("Failed to track site event:", error.message);
    }
  } catch (error) {
    console.error("Failed to track site event:", error);
  }
}
