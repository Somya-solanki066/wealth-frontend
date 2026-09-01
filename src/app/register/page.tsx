"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { KeyRound, Mail, User as UserIcon, Eye, EyeOff, BookOpen } from "lucide-react";

// Reusable components
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import Loader from "@/components/ui/Loader";

function RegisterContent() {
  const { signUpWithEmail, signInWithGoogle, user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams ? searchParams.get("redirectTo") : null;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.push(redirectTo || "/");
    }
  }, [user, loading, router, redirectTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await signUpWithEmail(email, password, name);
      router.push(redirectTo || "/");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setError("");
    try {
      await signInWithGoogle();
      router.push(redirectTo || "/");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to sign in with Google.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080808] px-4 py-12">
      {/* Background Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] right-[20%] h-96 w-96 rounded-full bg-[var(--gd)]/5 blur-[100px]" />
        <div className="absolute bottom-[20%] left-[20%] h-96 w-96 rounded-full bg-[var(--gm)]/5 blur-[100px]" />
      </div>

      <Card hoverable={false} className="relative z-10 w-full max-w-md space-y-8 bg-[#0f0f0f] border border-[#242424] p-8 rounded-2xl shadow-2xl">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-3 group mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-[var(--bg1)] to-[var(--bg2)] border border-[var(--gm)] rounded-xl flex items-center justify-center text-lg text-[var(--gd)]">
              <BookOpen className="h-5 w-5 text-[var(--gd)]" />
            </div>
            <span className="font-serif font-black text-xl text-[var(--gd)] tracking-wide">
              Ink2Wealth
            </span>
          </Link>
          <h2 className="text-2xl font-serif font-bold text-white tracking-tight">
            Create an Account
          </h2>
          <p className="mt-1 text-xs text-[#909090]">
            Sign up to get started with Ink2Wealth Academy
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-xs leading-relaxed">
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              leftIcon={<UserIcon className="h-4.5 w-4.5" />}
            />

            <Input
              label="Email Address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              leftIcon={<Mail className="h-4.5 w-4.5" />}
            />

            <div>
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="•••••••• (min 6 characters)"
                leftIcon={<KeyRound className="h-4.5 w-4.5" />}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#909090] hover:text-white transition-colors"
                style={{ top: "28px" }} // offset for label height
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <Button
              type="submit"
              isLoading={isSubmitting}
              className="w-full"
            >
              Create Account
            </Button>
          </div>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#242424]" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-[#0f0f0f] px-2 text-[#606060]">Or register with</span>
          </div>
        </div>

        <div>
          <button
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-[#242424] rounded-lg bg-[#161616] text-xs font-bold text-zinc-300 hover:bg-[#161616]/50 hover:text-white transition-all duration-200 disabled:opacity-50"
          >
            {/* Google Icon SVG */}
            <svg className="h-4.5 w-4.5" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.47 15 0 12 0 7.35 0 3.37 2.67 1.42 6.56l3.86 3c.9-2.69 3.42-4.52 6.72-4.52z"
              />
              <path
                fill="#4285F4"
                d="M23.49 12.27c0-.81-.07-1.59-.2-2.27H12v4.51h6.46c-.29 1.48-1.14 2.73-2.42 3.57l3.77 2.92c2.2-2.03 3.68-5.02 3.68-8.73z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.78c-.23-.69-.36-1.43-.36-2.2s.13-1.51.36-2.2l-3.86-3C.52 9.12 0 10.51 0 12s.52 2.88 1.42 4.62l3.86-3c-.9-2.69-.9-5.38 0-8.08z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.97-1.07 7.96-2.91l-3.77-2.92c-1.12.75-2.56 1.21-4.19 1.21-3.3 0-5.82-1.83-6.72-4.52l-3.86 3C3.37 21.33 7.35 24 12 24z"
              />
            </svg>
            Google Sign In
          </button>
        </div>

        <p className="mt-8 text-center text-xs text-[#909090]">
          Already have an account?{" "}
          <Link
            href={redirectTo ? `/login?redirectTo=${redirectTo}` : "/login"}
            className="font-medium text-[var(--gd)] hover:text-[var(--gl)] transition-colors"
          >
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}

export default function Register() {
  return (
    <Suspense fallback={<Loader fullScreen />}>
      <RegisterContent />
    </Suspense>
  );
}
