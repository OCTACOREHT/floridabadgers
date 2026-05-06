"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const TRACK_WINDOW_MS = 30_000;

export function SiteTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    const now = Date.now();
    const dedupeKey = `site-track:${pathname}`;
    const previous = Number.parseInt(sessionStorage.getItem(dedupeKey) ?? "0", 10);
    if (Number.isFinite(previous) && now - previous < TRACK_WINDOW_MS) {
      return;
    }
    sessionStorage.setItem(dedupeKey, String(now));

    const payload = {
      path: pathname,
      referrer: document.referrer || null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
    };

    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {
      // Tracking is non-blocking.
    });
  }, [pathname]);

  return null;
}
