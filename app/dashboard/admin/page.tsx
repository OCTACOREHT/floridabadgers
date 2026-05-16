import Link from "next/link";
import { ArrowRight, KeyRound, UserPlus, UserIcon } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAuthenticatedUserFromServerCookies } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const user = await getAuthenticatedUserFromServerCookies();
  const isAdmin = user?.role === "admin";

  const actions = [
    {
      title: "My Profile",
      description: "View your personal information and manage your account credentials.",
      href: `/dashboard/tables/users?id=${user?.id}&mode=view`,
      icon: UserIcon,
      visible: true,
    },
    {
      title: "Password Reset",
      description: "Securely reset your password to keep your account safe.",
      href: "/dashboard/admin/password",
      icon: KeyRound,
      visible: true,
    },
    {
      title: "User Management",
      description: "Manage system users, add new accounts, and modify permissions.",
      href: "/dashboard/tables/users",
      icon: UserPlus,
      visible: isAdmin,
    },
  ];

  return (
    <div className="px-4 py-4 md:px-6 md:py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Account Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your personal information and security preferences.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {actions.filter(a => a.visible).map((action) => {
          const Icon = action.icon

          return (
            <Card key={action.title} className="h-full border-border/70 bg-card">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                  <Icon className="size-5" />
                </div>
                <CardTitle>{action.title}</CardTitle>
                <CardDescription>{action.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full shadow-sm">
                  <Link href={action.href}>
                    Go to {action.title.split(" ").pop()} <ArrowRight />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
