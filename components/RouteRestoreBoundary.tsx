"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const AUTH_RETURN_KEY = "florida:reload-public-after-admin";

function isAuthPath(pathname: string | null): boolean {
  return Boolean(
    pathname?.startsWith("/admin") ||
      pathname?.startsWith("/login") ||
      pathname?.startsWith("/dashboard")
  );
}

export function RouteRestoreBoundary({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) {
      return;
    }

    if (isAuthPath(pathname)) {
      sessionStorage.setItem(AUTH_RETURN_KEY, "1");
      return;
    }

    if (sessionStorage.getItem(AUTH_RETURN_KEY) === "1") {
      sessionStorage.removeItem(AUTH_RETURN_KEY);
      window.scrollTo(0, 0);

      if (pathname === "/" && window.location.search === "" && window.location.hash === "") {
        window.location.reload();
      } else {
        window.location.replace("/");
      }
    }
  }, [pathname]);

  return <>{children}</>;
}
