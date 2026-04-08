"use client";

import { Suspense, useEffect } from "react";
import { SignIn, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { Loader2, ArrowLeft, Plane } from "lucide-react";
import { TripWeaverLogo } from "@/components/TripWeaverLogo";
import { clerkDarkAppearance } from "@/lib/clerk-theme";

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
    <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Ambient decorative blobs */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-emerald-100/40 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-8%] w-[400px] h-[400px] rounded-full bg-amber-100/30 blur-3xl pointer-events-none" />

      <div className="w-full max-w-[440px] relative z-10">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-10 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Home
        </Link>

        {/* Logo & heading */}
        <div className="mb-8">
          <div className="mb-6">
            <TripWeaverLogo size="sm" />
          </div>
          <h1 className="text-heading text-foreground mb-1.5">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to your TripWeaver account
          </p>
        </div>

        {/* Clerk SignIn component */}
        <div className="clerk-container paper-card rounded-2xl p-6">
          <SignIn
            routing="hash"
            appearance={clerkDarkAppearance}
          />
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/select-role"
            className="text-emerald-600 hover:text-emerald-500 font-medium transition-colors"
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
    <div className="min-h-screen flex items-center justify-center bg-[#faf9f7]">
      <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
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
