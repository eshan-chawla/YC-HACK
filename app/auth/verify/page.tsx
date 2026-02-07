"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { TripWeaverLogo } from "@/components/TripWeaverLogo";

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"pending" | "success" | "error">("pending");
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(5);

  // Check for verification token in URL
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  useEffect(() => {
    if (token) {
      // If there's a token, the verification is complete
      // Convex Auth handles the verification automatically
      setStatus("success");
    }
  }, [token]);

  // Countdown for redirect after success
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Email Verified!</CardTitle>
            <CardDescription>
              Your email has been successfully verified.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              Redirecting to your dashboard in {countdown} seconds...
            </p>
          </CardContent>

          <CardFooter className="flex justify-center">
            <Button onClick={() => router.push("/admin")}>
              Go to Dashboard Now
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-red-100 p-3 dark:bg-red-900">
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Verification Failed</CardTitle>
            <CardDescription>
              We couldn&apos;t verify your email address.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>

          <CardFooter className="flex flex-col space-y-2">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => router.push("/auth/signup")}
            >
              Try Again
            </Button>
            <Link href="/auth/login" className="text-sm text-primary hover:underline">
              Back to Sign In
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Pending state - waiting for user to verify email
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Mail className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
          <CardDescription>
            We&apos;ve sent a verification link to your email address.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Click the link in the email to verify your account. If you don&apos;t see it, check your spam folder.
            </p>
          </div>

          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Waiting for verification...</span>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            Didn&apos;t receive the email?{" "}
            <button 
              className="text-primary hover:underline font-medium"
              onClick={() => {
                // TODO: Implement resend functionality
                alert("Resend functionality will be implemented");
              }}
            >
              Resend
            </button>
          </div>
          <Link 
            href="/auth/login" 
            className="text-sm text-muted-foreground hover:text-primary"
          >
            Back to Sign In
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
