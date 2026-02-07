"use client";

import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TripWeaverLogo } from "@/components/TripWeaverLogo";

export default function EmployeeSignupPage() {
  // Store the chosen role so onboarding pages can read it
  if (typeof window !== "undefined") {
    sessionStorage.setItem("tripweaver_signup_role", "employee");
  }

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center px-4 py-12">
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
            Create employee account
          </h1>
          <p className="text-sm text-slate-500">
            Set up your account to view itineraries and manage travel
          </p>
        </div>

        {/* Clerk SignUp component */}
        <div className="clerk-container">
          <SignUp
            routing="hash"
            forceRedirectUrl="/auth/onboarding/employee"
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
                footer: "hidden",
              },
            }}
          />
        </div>

        <div className="mt-8 pt-6 border-t border-white/[0.04] flex flex-col gap-2 text-center text-sm">
          <p className="text-slate-500">
            Are you an admin?{" "}
            <Link
              href="/auth/signup/admin"
              className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
            >
              Sign up as Admin
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
