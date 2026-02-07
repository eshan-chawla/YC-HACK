"use client";

import { Suspense, useEffect } from "react";
import { SignIn, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";
import { TripWeaverLogo } from "@/components/TripWeaverLogo";

function LoginForm() {
  const { isSignedIn } = useAuth();
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();
  const convex = useConvex();

  // After Clerk sign-in, check profile and redirect
  useEffect(() => {
    if (isSignedIn && isAuthenticated) {
      const checkProfile = async () => {
        try {
          const status = await convex.query(api.onboarding.getOnboardingStatus);
          if (status) {
            if (!status.onboardingCompleted) {
              router.push(`/auth/onboarding/${status.role}`);
            } else {
              router.push(`/${status.role}`);
            }
          } else {
            router.push("/auth/select-role");
          }
        } catch (err) {
          console.error("Failed to check profile:", err);
        }
      };
      checkProfile();
    }
  }, [isSignedIn, isAuthenticated, convex, router]);

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[440px]">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 mb-10 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Home
        </Link>

        {/* Logo & heading */}
        <div className="mb-8">
          <div className="mb-6">
            <TripWeaverLogo size="sm" />
          </div>
          <h1 className="text-2xl font-bold tracking-[-0.02em] text-white mb-1.5">
            Welcome back
          </h1>
          <p className="text-sm text-slate-500">
            Sign in to your TripWeaver account
          </p>
        </div>

        {/* Clerk SignIn component */}
        <div className="clerk-container">
          <SignIn
            routing="hash"
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "bg-transparent shadow-none p-0 w-full",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton:
                  "h-11 border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] text-slate-300",
                socialButtonsBlockButtonText: "text-slate-300 font-medium",
                dividerLine: "bg-white/[0.06]",
                dividerText: "text-slate-600 text-xs uppercase tracking-wider",
                formFieldLabel: "text-xs font-medium text-slate-400",
                formFieldInput:
                  "h-11 bg-white/[0.02] border-white/[0.08] text-white placeholder:text-slate-600 focus:border-emerald-500/40 focus:ring-emerald-500/10",
                formButtonPrimary:
                  "h-11 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30",
                footerActionLink:
                  "text-emerald-400 hover:text-emerald-300 font-medium",
                identityPreviewEditButton: "text-emerald-400",
                formFieldAction: "text-emerald-400",
                footer: "hidden",
              },
            }}
          />
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-slate-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/select-role"
            className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

function LoginLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617]">
      <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  );
}
