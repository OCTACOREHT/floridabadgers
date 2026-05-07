import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { newsArticles, type NewsArticle } from "@/lib/news";

type ActualiteRow = {
  id: string;
  titre: string | null;
  sous_titre: string | null;
  photo_url: string | null;
  description: string | null;
  is_published: boolean | null;
  created_at: string | null;
};

export type NewsArticleDetail = NewsArticle & {
  subtitle: string | null;
  contentHtml: string;
};

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

function toNewsArticleDetail(row: ActualiteRow): NewsArticleDetail | null {
  const title = row.titre?.trim();
  const description = row.description?.trim();
  const descriptionText = description ? stripHtmlToText(description) : "";
  const descriptionHtml = description ? normalizeArticleBodyHtml(description) : "";
  const subtitleText = row.sous_titre ? stripHtmlToText(row.sous_titre) : "";

  if (!title || !descriptionText || !descriptionHtml) {
    return null;
  }

  return {
    id: row.id,
    title,
    excerpt: subtitleText || truncateExcerpt(descriptionText),
    date: formatNewsDate(row.created_at),
    category: "Club",
    image: row.photo_url?.trim() || "/images/IMG_6281.JPG.jpeg",
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

  return {
    id: row.id,
    title,
    excerpt: subtitleText || truncateExcerpt(descriptionText),
    date: formatNewsDate(row.created_at),
    category: "Club",
    image: row.photo_url?.trim() || "/images/IMG_6281.JPG.jpeg",
  };
}

function getFallbackNewsArticleById(id: string): NewsArticleDetail | null {
  const fallback = newsArticles.find((article) => article.id === id);
  if (!fallback) {
    return null;
  }

  return {
    ...fallback,
    subtitle: fallback.excerpt,
    contentHtml: convertPlainTextToHtml(fallback.excerpt),
  };
}

export async function getPublishedNewsArticles(limit = 24): Promise<NewsArticle[]> {
  try {
    const supabase = createSupabaseServiceClient();
    const safeLimit = Math.max(1, Math.min(limit, 60));

    const { data, error } = await supabase
      .from("actualites")
      .select("id, titre, sous_titre, photo_url, description, is_published, created_at")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(safeLimit);

    if (error) {
      if (isMissingTableError(error)) {
        return [];
      }
      throw new Error(error.message);
    }

    const articles = ((data ?? []) as ActualiteRow[])
      .map(toNewsArticle)
      .filter((article): article is NewsArticle => Boolean(article));

    return articles;
  } catch {
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
    const { data, error } = await supabase
      .from("actualites")
      .select("id, titre, sous_titre, photo_url, description, is_published, created_at")
      .eq("id", normalizedId)
      .eq("is_published", true)
      .maybeSingle();

    if (error) {
      if (isMissingTableError(error)) {
        return getFallbackNewsArticleById(normalizedId);
      }
      throw new Error(error.message);
    }

    const detail = data ? toNewsArticleDetail(data as ActualiteRow) : null;
    return detail;
  } catch {
    return null;
  }
}
