"use client"

import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

function getLoginErrorMessage(rawMessage?: string) {
  const message = rawMessage?.toLowerCase() ?? ""

  if (message.includes("invalid login credentials") || message.includes("incorrect")) {
    return "Email ou mot de passe incorrect."
  }

  if (message.includes("email not confirmed")) {
    return "Votre email n'est pas encore confirme."
  }

  if (message.includes("too many")) {
    return "Trop de tentatives de connexion. Reessayez plus tard."
  }

  return "Connexion impossible. Verifiez vos informations et reessayez."
}

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      const normalizedEmail = email.trim().toLowerCase()

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
        }),
      })

      const responseBody = (await response.json().catch(() => null)) as
        | { error?: string }
        | null

      if (!response.ok) {
        setErrorMessage(getLoginErrorMessage(responseBody?.error))
        return
      }

      const nextPath = searchParams.get("next")
      const destination = nextPath && nextPath.startsWith("/dashboard") ? nextPath : "/dashboard"

      router.push(destination)
      router.refresh()
    } catch {
      setErrorMessage("Une erreur est survenue pendant la connexion.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="w-full border-border/70 shadow-2xl">
        <CardHeader className="items-center justify-items-center gap-3 px-6 pt-8 text-center">
          <Image
            src="/images/Florida Badgers.png"
            alt="Florida Badgers"
            width={72}
            height={72}
            className="mx-auto block h-16 w-auto object-contain"
            priority
          />
          <CardTitle className="text-2xl">Florida Badgers Admin</CardTitle>
          <CardDescription className="mx-auto max-w-sm">
            Enter your email and password to access the dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-8">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="m@example.com"
                  required
                  className="h-11"
                  autoComplete="email"
                  disabled={isSubmitting}
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  className="h-11"
                  autoComplete="current-password"
                  disabled={isSubmitting}
                />
              </Field>
              {errorMessage ? (
                <Field>
                  <p className="text-sm font-medium text-red-600">{errorMessage}</p>
                </Field>
              ) : null}
              <Field>
                <Button
                  type="submit"
                  className="h-11 w-full text-base font-semibold"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Connexion..." : "Login"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
