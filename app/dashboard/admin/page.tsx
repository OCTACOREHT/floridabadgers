import Link from "next/link";
import { ArrowRight, KeyRound, ShieldUser, UserPlus } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const adminActions = [
  {
    title: "Add User",
    description: "Open the users table and add new club accounts or update user records.",
    href: "/dashboard/tables/users",
    icon: UserPlus,
  },
  {
    title: "Roles",
    description: "Review role assignments and keep club access levels consistent.",
    href: "/dashboard/admin/roles",
    icon: ShieldUser,
  },
  {
    title: "Password Reset",
    description: "Prepare password reset workflows for staff and administrators.",
    href: "/dashboard/admin/password",
    icon: KeyRound,
  },
] as const;

export default function AdminHomePage() {
  return (
    <div className="px-4 py-4 md:px-6 md:py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Administration</h1>
        <p className="text-sm text-muted-foreground">
          Quick access to user, role, and password management.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {adminActions.map((action) => {
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
                    Open <ArrowRight />
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
