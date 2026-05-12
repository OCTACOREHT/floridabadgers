import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { type NewsArticle } from "@/lib/news";

type ActualiteRow = {
  id: string;
  titre: string | null;
  sous_titre: string | null;
  photo_url?: string | null;
  description: string | null;
  is_published: boolean | string | number | null;
  created_at: string | null;
};

export type NewsArticleDetail = NewsArticle & {
  subtitle: string | null;
  contentHtml: string;
};

const NEWS_QUERY_TIMEOUT_MS = 60000;
const NEWS_FALLBACK_WINDOW = 120;

function isMissingTableError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === "42P01") return true;

  const message = (error.message ?? "").toLowerCase();
  return (
    message.includes("does not exist") ||
    message.includes("relation") ||
    message.includes("schema cache") ||
    message.includes("could not find the table")
  );
}

function truncateExcerpt(value: string, maxLength = 180): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength - 3).trim()}...`;
}

function stripHtmlToText(value: string): string {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function convertPlainTextToHtml(value: string): string {
  const normalized = value.replace(/\r\n?/g, "\n").trim();
  if (!normalized) {
    return "";
  }

  return normalized
    .split(/\n{2,}/)
    .map((paragraph) =>
      `<p>${paragraph
        .split("\n")
        .map((line) => escapeHtml(line))
        .join("<br />")}</p>`
    )
    .join("");
}

function normalizeArticleBodyHtml(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(trimmed);
  if (!looksLikeHtml) {
    return convertPlainTextToHtml(trimmed);
  }

  const sanitized = trimmed
    .replace(/<\s*(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\s*\/\1\s*>/gi, "")
    .replace(/\s(on\w+)\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, "")
    .replace(/\sstyle\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, "")
    .replace(/\shref\s*=\s*"javascript:[^"]*"/gi, ' href="#"')
    .replace(/\shref\s*=\s*'javascript:[^']*'/gi, " href='#'")
    .trim();

  return sanitized || convertPlainTextToHtml(stripHtmlToText(trimmed));
}

async function withTimeout<T>(promise: PromiseLike<T>, timeoutMs = NEWS_QUERY_TIMEOUT_MS): Promise<T> {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(`News query timeout after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

function formatNewsDate(value: string | null): string {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) {
    return "May 2026";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function toCreatedAtTimestamp(value: string | null): number {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function isPublishedFlag(value: unknown): boolean {
  if (value === true) return true;
  if (typeof value === "number") return value === 1;
  if (typeof value !== "string") return false;

  const normalized = value.trim().toLowerCase();
  return ["true", "1", "yes", "on", "published"].includes(normalized);
}

function getNewsImagePath(articleId: string): string {
  return `/api/news/image/${encodeURIComponent(articleId)}`;
}

function toNewsArticleDetail(row: ActualiteRow): NewsArticleDetail | null {
  const title = row.titre?.trim();
  const description = row.description?.trim();
  const descriptionText = description ? stripHtmlToText(description) : "";
  const descriptionHtml = description ? normalizeArticleBodyHtml(description) : "";
  const subtitleText = row.sous_titre ? stripHtmlToText(row.sous_titre) : "";

  if (!title || !descriptionText || !descriptionHtml) {
    return null;
  }

  const rawImage = row.photo_url?.trim() ?? "";
  const detailImage = rawImage
    ? rawImage.startsWith("data:image/")
      ? getNewsImagePath(row.id)
      : rawImage
    : "/images/IMG_6281.JPG.jpeg";

  return {
    id: row.id,
    title,
    excerpt: subtitleText || truncateExcerpt(descriptionText),
    date: formatNewsDate(row.created_at),
    category: "Club",
    image: detailImage,
    subtitle: subtitleText || null,
    contentHtml: descriptionHtml,
  };
}

function toNewsArticle(row: ActualiteRow): NewsArticle | null {
  const title = row.titre?.trim();
  const subtitleText = row.sous_titre ? stripHtmlToText(row.sous_titre) : "";
  const description = row.description?.trim();
  const descriptionText = description ? stripHtmlToText(description) : "";
  if (!title) {
    return null;
  }

  const rawImage = row.photo_url?.trim() ?? "";
  const listImage = rawImage
    ? rawImage.startsWith("data:image/")
      ? getNewsImagePath(row.id)
      : rawImage
    : "/images/IMG_6281.JPG.jpeg";

  return {
    id: row.id,
    title,
    excerpt: subtitleText || truncateExcerpt(descriptionText),
    date: formatNewsDate(row.created_at),
    category: "Club",
    image: listImage,
  };
}

export async function getPublishedNewsArticles(limit = 24): Promise<NewsArticle[]> {
  const safeLimit = Math.max(1, Math.min(limit, 60));

  try {
    const supabase = createSupabaseServiceClient();

    const primary = await withTimeout(
      supabase
        .from("actualites")
        .select("id, titre, sous_titre, photo_url, description, created_at, is_published")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(safeLimit)
    );

    if (primary.error) {
      if (isMissingTableError(primary.error)) {
        return [];
      }
      throw new Error(primary.error.message);
    }

    const primaryArticles = ((primary.data ?? []) as ActualiteRow[])
      .map(toNewsArticle)
      .filter((article): article is NewsArticle => Boolean(article));

    if (primaryArticles.length > 0) {
      return primaryArticles;
    }

    const fallbackLimit = Math.max(safeLimit * 4, NEWS_FALLBACK_WINDOW);
    const fallback = await withTimeout(
      supabase
        .from("actualites")
        .select("id, titre, sous_titre, photo_url, description, created_at, is_published")
        .limit(fallbackLimit)
    );

    if (fallback.error) {
      if (isMissingTableError(fallback.error)) {
        return [];
      }
      throw new Error(fallback.error.message);
    }

    return ((fallback.data ?? []) as ActualiteRow[])
      .filter((row) => isPublishedFlag(row.is_published))
      .sort((a, b) => toCreatedAtTimestamp(b.created_at) - toCreatedAtTimestamp(a.created_at))
      .map(toNewsArticle)
      .filter((article): article is NewsArticle => Boolean(article))
      .slice(0, safeLimit);
  } catch (error) {
    console.error("[news] Failed to load published articles", error);
    return [];
  }
}

export async function getPublishedNewsArticleById(id: string): Promise<NewsArticleDetail | null> {
  const normalizedId = id.trim();
  if (!normalizedId) {
    return null;
  }

  try {
    const supabase = createSupabaseServiceClient();
    const { data, error } = await withTimeout(
      supabase
        .from("actualites")
        .select("id, titre, sous_titre, photo_url, description, is_published, created_at")
        .eq("id", normalizedId)
        .eq("is_published", true)
        .maybeSingle()
    );

    if (error) {
      if (isMissingTableError(error)) {
        return null;
      }
      throw new Error(error.message);
    }

    return data ? toNewsArticleDetail(data as ActualiteRow) : null;
  } catch (error) {
    console.error("[news] Failed to load published article by id", error);
    return null;
  }
}
