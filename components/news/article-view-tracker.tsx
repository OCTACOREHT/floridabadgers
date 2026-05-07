"use client";

import { useEffect } from "react";

type Props = {
  articleId: string;
  path: string;
};

export function ArticleViewTracker({ articleId, path }: Props) {
  useEffect(() => {
    const normalizedArticleId = articleId.trim();
    const normalizedPath = path.trim();
    if (!normalizedArticleId || !normalizedPath.startsWith("/")) {
      return;
    }

    const storageKey = `news-view:${normalizedArticleId}`;
    const now = Date.now();
    const previousRaw =
      typeof window !== "undefined" ? window.sessionStorage.getItem(storageKey) : null;
    const previous = previousRaw ? Number.parseInt(previousRaw, 10) : 0;

    if (Number.isFinite(previous) && previous > 0 && now - previous < 3000) {
      return;
    }

    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(storageKey, String(now));
    }

    const timezone =
      typeof Intl !== "undefined"
        ? Intl.DateTimeFormat().resolvedOptions().timeZone || null
        : null;

    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: normalizedPath,
        referrer: typeof window !== "undefined" ? window.location.pathname : null,
        timezone,
        articleId: normalizedArticleId,
      }),
      keepalive: true,
    }).catch(() => {
      // Non-blocking analytics.
    });
  }, [articleId, path]);

  return null;
}
