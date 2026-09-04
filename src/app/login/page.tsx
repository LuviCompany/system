"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";

import { LogoFull } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { siteConfig } from "@/config/site";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Não foi possível entrar.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Não foi possível conectar ao servidor. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-canvas px-4">
      <ThemeToggle className="absolute right-4 top-4" />
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-8">
        <div className="mb-8">
          <LogoFull className="h-9" />
          <p className="mt-3 text-sm text-ink-500">{siteConfig.tagline}</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" placeholder="voce@empresa.com" required autoComplete="email" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" name="password" type="password" required autoComplete="current-password" />
          </div>

          {error && (
            <p role="alert" className="rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-600">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
