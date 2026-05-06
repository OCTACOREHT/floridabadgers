import Link from "next/link";
import { ArrowRight, ShieldUser } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const roles = [
  {
    title: "Admin",
    description: "Full access to dashboard, content, and user management.",
  },
  {
    title: "Staff",
    description: "Operational access for day-to-day club administration.",
  },
  {
    title: "Coach",
    description: "Access to player and team workflows only.",
  },
  {
    title: "Player",
    description: "Limited access for player records and registration status.",
  },
] as const;

export default function AdminRolesPage() {
  return (
    <div className="px-4 py-4 md:px-6 md:py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Roles</h1>
        <p className="text-sm text-muted-foreground">
          Manage club access levels from the users table.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-border/70">
          <CardHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-black text-white">
              <ShieldUser className="size-5" />
            </div>
            <CardTitle>Role assignments</CardTitle>
            <CardDescription>
              The `users` table already stores a role field, so this screen is the control center for access planning.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {roles.map((role) => (
              <div key={role.title} className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="text-sm font-semibold">{role.title}</div>
                <p className="mt-1 text-sm text-muted-foreground">{role.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle>Update users</CardTitle>
            <CardDescription>
              Change role values directly from the users management table.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Use the users table when you need to add a person, update the assigned role, or review account details.
            </p>
            <Button asChild className="w-full bg-black text-white hover:bg-zinc-800">
              <Link href="/dashboard/tables/users">
                Open Users <ArrowRight />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
