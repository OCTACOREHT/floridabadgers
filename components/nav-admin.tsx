"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { KeyRound, ShieldUser, UserPlus } from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { isActivePath } from "@/components/sidebar-nav"

const adminItems = [
  {
    title: "Add User",
    href: "/dashboard/tables/users",
    icon: UserPlus,
  },
  {
    title: "Roles",
    href: "/dashboard/admin/roles",
    icon: ShieldUser,
  },
  {
    title: "Password Reset",
    href: "/dashboard/admin/password",
    icon: KeyRound,
  },
] as const

export function NavAdmin() {
  const pathname = usePathname()

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Administration</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {adminItems.map((item) => {
            const active = isActivePath(pathname, item.href)
            const Icon = item.icon

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={active}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
