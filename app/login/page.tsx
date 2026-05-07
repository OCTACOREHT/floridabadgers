import { Suspense } from "react"
import { LoginForm } from "@/components/login-form"

function LoginFormFallback() {
  return <div className="h-[520px] w-full animate-pulse rounded-xl bg-muted/40" aria-hidden />
}

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-white p-6 md:p-10">
      <div className="w-full max-w-md">
        <Suspense fallback={<LoginFormFallback />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
