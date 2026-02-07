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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-500 mx-auto mb-4" />
        <p className="text-slate-400">Redirecting to role selection...</p>
      </div>
    </div>
  );
}
