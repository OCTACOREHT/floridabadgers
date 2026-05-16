import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthenticatedUserFromServerCookies } from "@/lib/auth/session";
import { normalizeDashboardRole } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

const steps = [
  "Find the user in the users table.",
  "Confirm the role and account status.",
  "Apply the password reset flow through your auth backend.",
] as const;

export default async function AdminPasswordPage() {
  const user = await getAuthenticatedUserFromServerCookies();
  const role = normalizeDashboardRole(user?.role);
  if (role !== "admin") {
    redirect("/dashboard?error=unauthorized");
  }

  return (
    <div className="px-4 py-4 md:px-6 md:py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Password Reset</h1>
        <p className="text-sm text-muted-foreground">
          Keep account recovery and password changes in one place.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-border/70">
          <CardHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <KeyRound className="size-5" />
            </div>
            <CardTitle>Reset workflow</CardTitle>
            <CardDescription>
              Password changes should be handled from the authenticated admin flow, not from a public form.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {steps.map((step, index) => (
              <div key={step} className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                  {index + 1}
                </div>
                <p className="text-sm text-foreground">{step}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <LockKeyhole className="size-5" />
            </div>
            <CardTitle>Security note</CardTitle>
            <CardDescription>
              This dashboard screen is ready for an auth-backed reset action.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-4">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-foreground" />
              <p className="text-sm text-muted-foreground">
                When you wire this to Supabase Auth or a server action, keep it restricted to admin users only.
              </p>
            </div>
            <Button asChild className="w-full shadow-sm">
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
