import type { SupabaseClient } from "@supabase/supabase-js";

function deriveFallbackName(email: string) {
  const localPart = email.split("@")[0] ?? "Admin";
  const cleaned = localPart.replace(/[._-]+/g, " ").trim();
  return cleaned.length > 0 ? cleaned : "Admin";
}

function isUniqueViolation(code: string | undefined): boolean {
  return code === "23505";
}

export async function resolveArticleAuthorId(
  supabase: SupabaseClient,
  userEmail: string | null
): Promise<string> {
  const normalizedEmail = userEmail?.trim().toLowerCase() ?? "";
  if (!normalizedEmail) {
    throw new Error("Authenticated user email is missing.");
  }

  const { data: existingUser, error: existingUserError } = await supabase
    .from("users")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (existingUserError) {
    throw new Error(existingUserError.message);
  }

  if (existingUser?.id) {
    return String(existingUser.id);
  }

  const { data: insertedUser, error: insertError } = await supabase
    .from("users")
    .insert({
      email: normalizedEmail,
      full_name: deriveFallbackName(normalizedEmail),
    })
    .select("id")
    .single();

  if (!insertError && insertedUser?.id) {
    return String(insertedUser.id);
  }

  if (isUniqueViolation(insertError?.code)) {
    const { data: racedUser, error: racedUserError } = await supabase
      .from("users")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (racedUserError) {
      throw new Error(racedUserError.message);
    }

    if (racedUser?.id) {
      return String(racedUser.id);
    }
  }

  throw new Error(insertError?.message ?? "Unable to resolve article author.");
}
