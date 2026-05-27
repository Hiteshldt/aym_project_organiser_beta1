"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showEmail, setShowEmail] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password.");
    } else {
      router.push("/workspace");
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/workspace" });
  }

  return (
    <div className="min-h-screen bg-grain flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-10 text-center">
          <Link
            href="/"
            className="font-display-italic text-4xl text-ink leading-none inline-block"
          >
            Ayuvam
          </Link>
          <p className="mt-3 text-sm text-mute">
            Make the work look as good as it is.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-line bg-paper-elevated p-7 space-y-5">
          {/* Google */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full inline-flex items-center justify-center gap-3 rounded-lg border border-line-strong bg-paper-elevated px-4 py-3 text-sm font-medium text-ink hover:bg-paper hover:border-ink transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {googleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <GoogleLogo className="h-4 w-4" />
            )}
            Continue with Google
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-line" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-paper-elevated px-3 text-[11px] font-mono-ui uppercase tracking-wider text-mute-soft">
                or
              </span>
            </div>
          </div>

          {/* Email/password — collapsed by default */}
          {!showEmail ? (
            <button
              type="button"
              onClick={() => setShowEmail(true)}
              className="w-full text-sm text-mute hover:text-ink transition-colors py-2"
            >
              Sign in with email
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@studio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <p className="text-xs text-danger text-center">{error}</p>
              )}

              <Button
                type="submit"
                variant="accent"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-mute-soft">
          New to Ayuvam? Continue with Google to create your account.
        </p>
        <p className="mt-2 text-center text-[11px] text-mute-soft">
          By continuing you agree to our{" "}
          <Link href="/terms" className="underline hover:text-ink">
            terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-ink">
            privacy policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="M22.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.32z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.83z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"
        fill="#EA4335"
      />
    </svg>
  );
}
