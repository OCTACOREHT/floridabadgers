"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"

import { NavAdmin } from "@/components/nav-admin"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  ZapIcon,
  LayoutDashboardIcon,
  ClipboardListIcon,
  ChartSplineIcon,
  GoalIcon,
  NewspaperIcon,
  UsersIcon,
  Settings2Icon,
  LayoutPanelTopIcon,
  MailIcon,
  XCircleIcon,
  BanknoteIcon,
  CreditCardIcon,
  FileBarChartIcon,
} from "lucide-react"

import { AuthenticatedUser } from "@/lib/auth/session"
import { normalizeDashboardRole } from "@/lib/auth/permissions"

const data = {
  // ... (keep static data as is or remove user from it)
  navMain: [
    {
      title: "Quick Payment",
      url: "/dashboard/payments/quick",
      icon: <ZapIcon className="text-amber-500" />,
    },
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "Registrations",
      url: "/dashboard/tables/inscriptions_joueurs",
      icon: <ClipboardListIcon />,
    },
    {
      title: "Contact Messages",
      url: "/dashboard/tables/contact_messages",
      icon: <MailIcon />,
    },
    {
      title: "Analytics",
      url: "/dashboard/analytics",
      icon: <ChartSplineIcon />,
    },
    {
      title: "Matches",
      url: "/dashboard/tables/matchs",
      icon: <GoalIcon />,
    },
    {
      title: "Articles",
      url: "/dashboard/articles",
      icon: <NewspaperIcon />,
    },
    {
      title: "Players",
      url: "/dashboard/tables/joueurs",
      icon: <UsersIcon />,
    },
    {
      title: "Hero Carousel",
      url: "/dashboard/tables/hero_slides",
      icon: <LayoutPanelTopIcon />,
    },
    {
      title: "Finance",
      url: "/dashboard/finance",
      icon: <BanknoteIcon />,
    },
    {
      title: "Reports",
      url: "/dashboard/reports",
      icon: <FileBarChartIcon />,
    },
    {
      title: "Payments",
      url: "/dashboard/tables/paiements",
      icon: <CreditCardIcon />,
    },
    {
      title: "Payment Tracking",
      url: "/dashboard/payments/tracking",
      icon: <ClipboardListIcon className="text-emerald-500" />,
    },
    {
      title: "Not Players",
      url: "/dashboard/not-players",
      icon: <XCircleIcon />,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/dashboard/admin",
      icon: <Settings2Icon />,
    },
  ],
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: AuthenticatedUser
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const role = normalizeDashboardRole(user.role)

  const financeItems = new Set([
    "Quick Payment",
    "Finance",
    "Payments",
    "Reports",
    "Payment Tracking",
  ])
  const mediaItems = new Set([
    "Articles",
    "Hero Carousel",
    "Contact Messages",
  ])

  const filteredNavMain =
    role === "admin"
      ? data.navMain
      : role === "finance"
        ? data.navMain.filter((item) => financeItems.has(item.title))
        : role === "media"
          ? data.navMain.filter((item) => mediaItems.has(item.title))
          : []

  const sidebarUser = {
    name: user.full_name || user.email?.split("@")[0] || "User",
    email: user.email || "",
    avatar: "", // Handled by initials in NavUser
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link
              href="/dashboard"
              className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Image
                src="/images/Florida Badgers.png"
                alt="Florida Badgers"
                width={40}
                height={40}
                className="block h-10 w-10 shrink-0 object-contain"
                priority
              />
              <span className="text-base font-semibold leading-none">Florida Badgers</span>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredNavMain} />
        {role === "admin" && <NavAdmin />}
        <NavSecondary items={data.navSecondary} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sidebarUser} />
      </SidebarFooter>
    </Sidebar>
  )
}
