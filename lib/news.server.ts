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

function toNewsArticle(row: ActualiteRow): NewsArticle | null {
  const title = row.titre?.trim();
  const description = row.description?.trim();

  if (!title || !description) {
    return null;
  }

  return {
    id: row.id,
    title,
    excerpt: row.sous_titre?.trim() || truncateExcerpt(description),
    date: formatNewsDate(row.created_at),
    category: "Club",
    image: row.photo_url?.trim() || "/images/IMG_6281.JPG.jpeg",
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
        return newsArticles.slice(0, safeLimit);
      }
      throw new Error(error.message);
    }

    const articles = ((data ?? []) as ActualiteRow[])
      .map(toNewsArticle)
      .filter((article): article is NewsArticle => Boolean(article));

    return articles.length ? articles : newsArticles.slice(0, safeLimit);
  } catch {
    return newsArticles.slice(0, Math.max(1, Math.min(limit, 60)));
  }
}
