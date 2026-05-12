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
  LayoutDashboardIcon,
  ClipboardListIcon,
  ChartSplineIcon,
  GoalIcon,
  NewspaperIcon,
  UsersIcon,
  Settings2Icon,
  LayoutPanelTopIcon,
} from "lucide-react"

const data = {
  user: {
    name: "Florida Badgers",
    email: "floridabadgersfc@gmail.com",
    avatar: "/images/Florida Badgers.png",
  },
  navMain: [
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
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/dashboard/tables",
      icon: <Settings2Icon />,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
        <NavMain items={data.navMain} />
        <NavAdmin />
        <NavSecondary items={data.navSecondary} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
