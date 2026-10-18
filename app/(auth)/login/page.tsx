"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { signInWithEmail, sendPhoneOtp, verifyPhoneOtp } from "@/lib/auth-actions";
import { discardGuestCartOnLogin } from "@/actions/cart";

export default function LoginPage() {
  // Email/password tab state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailPending, startEmailTransition] = useTransition();

  // Phone OTP tab state
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phonePending, startPhoneTransition] = useTransition();

  function fillAdmin() {
    setEmail("admin@kartiva.dev");
    setPassword("Admin@kartiva123");
    setEmailError(null);
  }

  function handleEmailSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEmailError(null);
    const formData = new FormData(e.currentTarget);
    startEmailTransition(async () => {
      const result = await signInWithEmail(formData);
      if (result?.error) {
        setEmailError(result.error);
      } else {
        // Clear guest cart after successful login
        await discardGuestCartOnLogin();
      }
    });
  }

  function handleSendOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPhoneError(null);
    const formData = new FormData(e.currentTarget);
    startPhoneTransition(async () => {
      const result = await sendPhoneOtp(formData);
      if (result?.error) {
        setPhoneError(result.error);
      } else {
        setOtpSent(true);
      }
    });
  }

  function handleVerifyOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPhoneError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("phone", phone);
    startPhoneTransition(async () => {
      const result = await verifyPhoneOtp(formData);
      if (result?.error) {
        setPhoneError(result.error);
      } else {
        // Clear guest cart after successful login
        await discardGuestCartOnLogin();
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back to Kartiva
        </p>
      </div>

      <Tabs defaultValue="email">
        <TabsList className="w-full">
          <TabsTrigger value="email" className="flex-1">
            Email
          </TabsTrigger>
          <TabsTrigger value="phone" className="flex-1">
            Phone OTP
          </TabsTrigger>
        </TabsList>

        {/* Email / Password tab */}
        <TabsContent value="email" className="mt-4">
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="email">Email</Label>
                <button
                  type="button"
                  onClick={fillAdmin}
                  className="text-xs text-primary font-medium hover:underline focus:outline-none"
                >
                  Fill Admin Credentials
                </button>
              </div>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={emailPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={emailPending}
              />
            </div>

            {emailError && (
              <p className="text-sm text-destructive">{emailError}</p>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={emailPending}>
              {emailPending ? "Signing in…" : "Sign in"}
            </Button>

            <div className="rounded-lg bg-surface-container-low p-3 text-xs text-on-surface-variant flex items-start gap-2">
              <span className="material-symbols-outlined text-[16px] text-primary shrink-0 mt-0.5">
                shield_person
              </span>
              <div>
                <p className="font-semibold text-on-surface">Admin Credentials (Pre-configured):</p>
                <p className="mt-0.5">Email: <code className="bg-surface-container px-1 py-0.5 rounded font-mono">admin@kartiva.dev</code></p>
                <p className="mt-0.5">Password: <code className="bg-surface-container px-1 py-0.5 rounded font-mono">Admin@kartiva123</code></p>
              </div>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              <Link href="/reset" className="underline underline-offset-4 hover:text-foreground">
                Forgot password?
              </Link>
            </p>
          </form>
        </TabsContent>

        {/* Phone OTP tab */}
        <TabsContent value="phone" className="mt-4">
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-800 dark:text-amber-300 mb-4 flex items-start gap-2">
            <span className="material-symbols-outlined text-[18px] text-amber-600 shrink-0 mt-0.5">
              info
            </span>
            <p>
              Phone SMS requires an active SMS gateway (Twilio / MessageBird) configured in your Supabase project. For instant sign-in, please switch to the <strong>Email</strong> tab.
            </p>
          </div>

          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone number</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+919876543210"
                  autoComplete="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={phonePending}
                />
                <p className="text-xs text-muted-foreground">
                  Include country code, e.g. +91 for India
                </p>
              </div>

              {phoneError && (
                <p className="text-sm text-destructive">{phoneError}</p>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={phonePending}>
                {phonePending ? "Sending OTP…" : "Send OTP"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                OTP sent to <span className="font-medium text-foreground">{phone}</span>
              </p>

              <div className="space-y-1.5">
                <Label htmlFor="token">OTP</Label>
                <Input
                  id="token"
                  name="token"
                  type="text"
                  inputMode="numeric"
                  placeholder="123456"
                  maxLength={6}
                  required
                  disabled={phonePending}
                />
              </div>

              {phoneError && (
                <p className="text-sm text-destructive">{phoneError}</p>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={phonePending}>
                {phonePending ? "Verifying…" : "Verify OTP"}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setOtpSent(false);
                  setPhoneError(null);
                }}
                className="w-full text-center text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
              >
                Change phone number
              </button>
            </form>
          )}
        </TabsContent>
      </Tabs>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-foreground underline underline-offset-4 hover:opacity-80">
          Register
        </Link>
      </p>
    </div>
  );
}
