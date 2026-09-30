"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { authClient } from "@/frontend/lib/auth-client";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { DesignIcon } from "./design-icon";
export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const registering = mode === "register";
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [visible, setVisible] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email")).trim();
    const password = String(data.get("password"));
    const emailField = event.currentTarget.elements.namedItem("email") as HTMLInputElement;
    if (!emailField.validity.valid) {
      setError("Enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Enter your password.");
      return;
    }
    if (registering && !String(data.get("name")).trim()) {
      setError("Enter your name.");
      return;
    }
    if (registering && password.length < 10) {
      setError("Use at least 10 characters for your password.");
      return;
    }
    if (registering && password !== data.get("confirmPassword")) {
      setError("Your passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const result = registering
        ? await authClient.signUp.email({ name: String(data.get("name")).trim(), email, password })
        : await authClient.signIn.email({ email, password });
      if (result.error) {
        setError(result.error.message || "Unable to sign in. Please try again.");
        return;
      }
      const session = await authClient.getSession();
      if (!session.data?.user) {
        setError("Account saved, but sign-in did not complete. Please try signing in again.");
        return;
      }
      router.replace("/notes");
      router.refresh();
    } catch {
      setError("Could not connect. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-shell">
      <p className="text-[21px] font-bold">NoteVault</p>
      <section className="auth-card panel">
        <div className="brand-tile mx-auto">
          <DesignIcon name="pen" />
        </div>
        <h1 className="mt-7 text-center text-[22px] font-bold">
          {registering ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-3 text-center text-[13px] text-muted-foreground">
          {registering
            ? "Start sharing notes securely with NoteVault."
            : "Sign in to your NoteVault account."}
        </p>
        <form onSubmit={submit} noValidate className="mt-10 space-y-6">
          {registering && (
            <div>
              <label className="field-label" htmlFor="name">
                Full name
              </label>
              <Input
                id="name"
                name="name"
                autoComplete="name"
                required
                maxLength={80}
                placeholder="Your name"
                className="h-[46px]"
              />
            </div>
          )}
          <div>
            <label className="field-label" htmlFor="email">
              Email address
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              placeholder="you@example.com"
              className="h-[46px]"
            />
          </div>
          <div className={registering ? "grid grid-cols-2 gap-4" : ""}>
            <div>
              <label className="field-label" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={visible ? "text" : "password"}
                  autoComplete={registering ? "new-password" : "current-password"}
                  required
                  minLength={registering ? 10 : undefined}
                  maxLength={128}
                  placeholder={registering ? "10+ characters" : "Enter your password"}
                  className="h-[46px] pr-10"
                />
                {!registering && (
                  <button
                    type="button"
                    aria-label={visible ? "Hide password" : "Show password"}
                    onClick={() => setVisible(!visible)}
                    className="absolute top-0 right-0 flex h-full w-10 items-center justify-center"
                  >
                    <DesignIcon name="eye" />
                  </button>
                )}
              </div>
            </div>
            {registering && (
              <div>
                <label className="field-label" htmlFor="confirmPassword">
                  Confirm password
                </label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={10}
                  maxLength={128}
                  placeholder="Repeat password"
                  className="h-[46px]"
                />
              </div>
            )}
          </div>
          {error && (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          )}
          <Button className="h-[50px] w-full" disabled={busy}>
            {busy ? <LoaderCircle className="animate-spin" /> : <DesignIcon name="arrow" />}
            {busy ? "Please wait…" : registering ? "Create account" : "Sign in"}
          </Button>
        </form>
        <p className="mt-8 border-t pt-6 text-center text-xs text-muted-foreground">
          {registering ? "Already have an account?" : "Don't have an account?"}{" "}
          <Link
            className="font-semibold text-primary hover:underline"
            href={registering ? "/login" : "/register"}
          >
            {registering ? "Sign in" : "Create one"}
          </Link>
        </p>
      </section>
    </main>
  );
}
