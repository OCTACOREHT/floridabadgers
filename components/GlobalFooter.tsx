"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/SiteFooter";

export function GlobalFooter() {
  const pathname = usePathname();

  if (!pathname) {
    return null;
  }

  if (pathname === "/" || pathname.startsWith("/admin") || pathname.startsWith("/login")) {
    return null;
  }

  return <SiteFooter />;
}
