"use client";

import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TripWeaverLogo } from "@/components/TripWeaverLogo";
import { clerkDarkAppearance } from "@/lib/clerk-theme";

export default function EmployeeSignupPage() {
  // Store the chosen role so onboarding pages can read it
  if (typeof window !== "undefined") {
    sessionStorage.setItem("tripweaver_signup_role", "employee");
  }

  return (
    <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Ambient decorative blobs */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-emerald-100/40 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-8%] w-[400px] h-[400px] rounded-full bg-amber-100/30 blur-3xl pointer-events-none" />

      <div className="w-full max-w-[440px] relative z-10">
        {/* Back */}
        <Link
          href="/auth/select-role"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-10 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="mb-6">
            <TripWeaverLogo size="sm" />
          </div>
          <h1 className="text-heading text-foreground mb-1.5">
            Create employee account
          </h1>
          <p className="text-sm text-muted-foreground">
            Set up your account to view itineraries and manage travel
          </p>
        </div>

        {/* Clerk SignUp component */}
        <div className="clerk-container paper-card rounded-2xl p-6">
          <SignUp
            routing="hash"
            forceRedirectUrl="/auth/onboarding/employee"
            appearance={clerkDarkAppearance}
          />
        </div>

        <div className="mt-8 pt-6 border-t border-black/[0.06] flex flex-col gap-2 text-center text-sm">
          <p className="text-muted-foreground">
            Are you an admin?{" "}
            <Link
              href="/auth/signup/admin"
              className="text-emerald-600 hover:text-emerald-500 font-medium transition-colors"
            >
              Sign up as Admin
            </Link>
          </p>
          <p className="text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-emerald-600 hover:text-emerald-500 font-medium transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
