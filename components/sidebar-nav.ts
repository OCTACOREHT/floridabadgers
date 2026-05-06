export function normalizePathname(pathname: string) {
  return pathname.replace(/\/+$/, "") || "/"
}

export function isActivePath(pathname: string | null, href: string) {
  if (!pathname) {
    return false
  }

  return normalizePathname(pathname) === normalizePathname(href)
}
