"use client"

import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { LogoutButton } from "@/components/dashboard/logout-button"
import { usePathname } from "next/navigation"

export function SiteHeader() {
  const pathname = usePathname()
  const isFinanceArea =
    pathname?.startsWith("/dashboard/finance") || pathname?.startsWith("/dashboard/payments")
  const headerTitle = isFinanceArea ? "Finance" : "Dashboard"

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] duration-75 ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{headerTitle}</h1>
        <div className="ml-auto">
          <LogoutButton />
        </div>
      </div>
    </header>
  )
}
