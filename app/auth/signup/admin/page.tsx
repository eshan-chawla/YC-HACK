"use client";

import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TripWeaverLogo } from "@/components/TripWeaverLogo";
import { clerkDarkAppearance } from "@/lib/clerk-theme";

export default function AdminSignupPage() {
  // Store the chosen role so onboarding pages can read it
  if (typeof window !== "undefined") {
    sessionStorage.setItem("tripweaver_signup_role", "admin");
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[440px]">
        {/* Back */}
        <Link
          href="/auth/select-role"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 mb-10 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="mb-6">
            <TripWeaverLogo size="sm" />
          </div>
          <h1 className="text-2xl font-bold tracking-[-0.02em] text-white mb-1.5">
            Create admin account
          </h1>
          <p className="text-sm text-slate-500">
            Set up your management account to organize corporate travel
          </p>
        </div>

        {/* Clerk SignUp component */}
        <div className="clerk-container">
          <SignUp
            routing="hash"
            forceRedirectUrl="/auth/onboarding/admin"
            appearance={clerkDarkAppearance}
          />
        </div>

        <div className="mt-8 pt-6 border-t border-white/[0.04] flex flex-col gap-2 text-center text-sm">
          <p className="text-slate-500">
            Not an admin?{" "}
            <Link
              href="/auth/signup/employee"
              className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
            >
              Sign up as Employee
            </Link>
          </p>
          <p className="text-slate-500">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
