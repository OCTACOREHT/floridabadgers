"use client";

import Link, { type LinkProps } from "next/link";

type TrackedNewsLinkProps = LinkProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    articleId: string;
    eventPath?: string;
  };

export function TrackedNewsLink({
  articleId,
  eventPath,
  onClick,
  href,
  ...props
}: TrackedNewsLinkProps) {
  const normalizedId = articleId.trim();
  const trackedPath = eventPath ?? `/news/article/${normalizedId}`;

  return (
    <Link
      href={href}
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        if (!normalizedId) return;
        if (!trackedPath.startsWith("/")) return;

        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || null;

        fetch("/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: trackedPath,
            referrer: window.location.pathname,
            timezone,
            articleId: normalizedId,
          }),
          keepalive: true,
        }).catch(() => {
          // Tracking remains non-blocking.
        });
      }}
    />
  );
}
