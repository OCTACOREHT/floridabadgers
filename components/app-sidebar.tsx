"use client"

import * as React from "react"

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
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { LayoutDashboardIcon, ClipboardListIcon, ChartSplineIcon, GoalIcon, UsersIcon, Settings2Icon, CommandIcon } from "lucide-react"

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
      url: "/dashboard/tables/site_events",
      icon: <ChartSplineIcon />,
    },
    {
      title: "Matches",
      url: "/dashboard/tables/matchs",
      icon: <GoalIcon />,
    },
    {
      title: "Players",
      url: "/dashboard/tables/joueurs",
      icon: <UsersIcon />,
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
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a href="/dashboard">
                <CommandIcon className="size-5!" />
                <span className="text-base font-semibold">Florida Badgers</span>
              </a>
            </SidebarMenuButton>
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
