"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { TripWeaverLogo } from "@/components/TripWeaverLogo";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"pending" | "success" | "error">("pending");
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(5);

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  useEffect(() => {
    if (token) {
      setStatus("success");
    }
  }, [token]);

  useEffect(() => {
    if (status === "success" && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (status === "success" && countdown === 0) {
      router.push("/admin");
    }
  }, [status, countdown, router]);

  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f7] p-4 relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-emerald-100/40 blur-3xl pointer-events-none" />
        <div className="paper-card rounded-2xl w-full max-w-md p-8 text-center relative z-10">
          <div className="flex justify-center mb-4">
            <div className="paper-inset blob-3 w-16 h-16 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
          </div>
          <h1 className="text-heading text-foreground mb-2">Email Verified!</h1>
          <p className="text-muted-foreground mb-6">
            Your email has been successfully verified. Redirecting in {countdown}s...
          </p>
          <Button onClick={() => router.push("/admin")} className="btn-emerald-solid rounded-xl px-6">
            Go to Dashboard Now
          </Button>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f7] p-4 relative overflow-hidden">
        <div className="absolute bottom-[-15%] left-[-8%] w-[400px] h-[400px] rounded-full bg-red-100/30 blur-3xl pointer-events-none" />
        <div className="paper-card rounded-2xl w-full max-w-md p-8 text-center relative z-10">
          <div className="flex justify-center mb-4">
            <div className="paper-inset blob-4 w-16 h-16 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </div>
          <h1 className="text-heading text-foreground mb-2">Verification Failed</h1>
          <p className="text-muted-foreground mb-2">We couldn&apos;t verify your email address.</p>
          {error && <p className="text-sm text-red-500 mb-6">{error}</p>}
          <div className="flex flex-col gap-3">
            <Button variant="outline" className="w-full rounded-xl" onClick={() => router.push("/auth/signup")}>
              Try Again
            </Button>
            <Link href="/auth/login" className="text-sm text-emerald-600 hover:text-emerald-500">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf9f7] p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-emerald-100/40 blur-3xl pointer-events-none" />
      <div className="paper-card rounded-2xl w-full max-w-md p-8 text-center relative z-10">
        <div className="flex justify-center mb-4">
          <div className="paper-inset blob-2 w-16 h-16 flex items-center justify-center">
            <Mail className="h-8 w-8 text-emerald-600" />
          </div>
        </div>
        <h1 className="text-heading text-foreground mb-2">Check your email</h1>
        <p className="text-muted-foreground mb-6">
          We&apos;ve sent a verification link to your email address.
        </p>
        <div className="paper-inset rounded-xl p-4 mb-6">
          <p className="text-sm text-muted-foreground">
            Click the link in the email to verify your account. If you don&apos;t see it, check your spam folder.
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Waiting for verification...</span>
        </div>
        <div className="text-center text-sm text-muted-foreground space-y-2">
          <p>
            Didn&apos;t receive the email?{" "}
            <button className="text-emerald-600 hover:text-emerald-500 font-medium">Resend</button>
          </p>
          <Link href="/auth/login" className="text-sm text-muted-foreground hover:text-emerald-600 block">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f7] p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
