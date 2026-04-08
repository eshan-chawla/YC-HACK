"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

// Redirect to role selection - users must choose a role before signing up
export default function SignupPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/auth/select-role");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf9f7]">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-4" />
        <p className="text-muted-foreground">Redirecting to role selection...</p>
      </div>
    </div>
  );
}
