"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useConvexAuth, useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { TripWeaverLogo } from "@/components/TripWeaverLogo";
import { ShieldCheck, Globe, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";

const roles = [
  {
    id: "admin",
    title: "Admin / Manager",
    description: "Manage travel policies, approve bookings, and oversee your organization's travel.",
    icon: ShieldCheck,
    items: [
      "Configure company travel policies",
      "Set budgets and spending limits",
      "View reports and analytics",
      "Manage employee travel events",
    ],
    href: "/auth/signup/admin",
  },
  {
    id: "employee",
    title: "Employee",
    description: "View your itineraries, set preferences, and chat with the AI travel assistant.",
    icon: Globe,
    items: [
      "View personalized itineraries",
      "Set your travel preferences",
      "Chat with AI travel assistant",
      "Track expenses and receipts",
    ],
    href: "/auth/signup/employee",
  },
];

export default function SelectRolePage() {
  const { isSignedIn } = useAuth();
  const { isAuthenticated } = useConvexAuth();
  const convex = useConvex();
  const router = useRouter();
  const [redirectChecked, setRedirectChecked] = useState(false);

  // Already signed-in: send to onboarding or dashboard (same as login)
  useEffect(() => {
    if (!isSignedIn || !isAuthenticated) {
      setRedirectChecked(true);
      return;
    }
    let cancelled = false;
    convex.query(api.onboarding.getOnboardingStatus).then((status) => {
      if (cancelled) return;
      if (status) {
        if (status.onboardingCompleted) {
          router.push(`/${status.role}`);
        } else {
          router.push(`/auth/onboarding/${status.role}`);
        }
      } else {
        setRedirectChecked(true);
      }
    }).catch(() => setRedirectChecked(true));
    return () => { cancelled = true; };
  }, [isSignedIn, isAuthenticated, convex, router]);

  if (isSignedIn && isAuthenticated && !redirectChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[720px]">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {/* Back */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 mb-10 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Home
          </Link>

          {/* Header */}
          <div className="mb-10">
            <div className="mb-6">
              <TripWeaverLogo size="sm" />
            </div>
            <h1 className="text-2xl font-bold tracking-[-0.02em] text-white mb-1.5">
              How will you use TripWeaver?
            </h1>
            <p className="text-sm text-slate-500">
              Choose your role to get the right experience.
            </p>
          </div>

          {/* Cards */}
          <div className="grid md:grid-cols-2 gap-4">
            {roles.map((role, i) => (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + i * 0.06, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <Link href={role.href} className="block group">
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 hover:border-emerald-500/25 hover:bg-white/[0.03] transition-all duration-200 h-full flex flex-col">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-5">
                      <role.icon className="w-5 h-5 text-emerald-400" />
                    </div>
                    <h3 className="text-base font-semibold text-white mb-1.5 tracking-[-0.01em]">{role.title}</h3>
                    <p className="text-sm text-slate-500 mb-5 leading-relaxed">{role.description}</p>
                    <ul className="space-y-2.5 mb-6 flex-1">
                      {role.items.map((item) => (
                        <li key={item} className="flex items-center gap-2.5 text-sm text-slate-400">
                          <div className="w-1 h-1 rounded-full bg-emerald-500/60 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <Button
                      variant="outline"
                      className="w-full border-white/[0.08] hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all duration-200 text-sm group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600"
                    >
                      Continue as {role.id === "admin" ? "Admin" : "Employee"}
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Sign in link */}
          <p className="mt-8 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
