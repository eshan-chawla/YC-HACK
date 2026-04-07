"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { TripWeaverLogo } from "@/components/TripWeaverLogo";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, 
  User, 
  Building2, 
  Briefcase, 
  Phone, 
  Globe, 
  Bell, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2,
  Home,
} from "lucide-react";

const STEPS = [
  { id: 1, title: "Basic Info", icon: User },
  { id: 2, title: "Profile Setup", icon: Briefcase },
  { id: 3, title: "Preferences", icon: Bell },
];

const TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HT)" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Paris", label: "Central European (CET)" },
  { value: "Asia/Tokyo", label: "Japan (JST)" },
  { value: "Asia/Shanghai", label: "China (CST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
];

const CURRENCIES = [
  { value: "USD", label: "US Dollar (USD)" },
  { value: "EUR", label: "Euro (EUR)" },
  { value: "GBP", label: "British Pound (GBP)" },
  { value: "CAD", label: "Canadian Dollar (CAD)" },
  { value: "AUD", label: "Australian Dollar (AUD)" },
  { value: "JPY", label: "Japanese Yen (JPY)" },
  { value: "CNY", label: "Chinese Yuan (CNY)" },
  { value: "INR", label: "Indian Rupee (INR)" },
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "zh", label: "Chinese" },
  { value: "ja", label: "Japanese" },
];

export default function AdminOnboardingPage() {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const status = useQuery(api.onboarding.getOnboardingStatus);
  const completeOnboarding = useMutation(api.onboarding.completeAdminOnboarding);

  // Already onboarded: go to dashboard
  useEffect(() => {
    if (isAuthenticated && status !== undefined && status?.onboardingCompleted) {
      router.replace(`/admin`);
    }
  }, [isAuthenticated, status, router]);

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    fullName: "",
    companyName: "",
    department: "",
    phoneNumber: "",
    
    // Step 2: Profile Setup
    jobTitle: "",
    timezone: "",
    
    // Step 3: Preferences
    currency: "USD",
    language: "en",
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
  });

  const updateFormData = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.fullName && formData.companyName && formData.department;
      case 2:
        return formData.jobTitle && formData.timezone;
      case 3:
        return formData.currency && formData.language;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Wait for auth/status before showing form (avoid flash then redirect)
  if (isAuthenticated && status === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      await completeOnboarding({
        fullName: formData.fullName,
        companyName: formData.companyName,
        department: formData.department,
        phoneNumber: formData.phoneNumber || undefined,
        jobTitle: formData.jobTitle,
        timezone: formData.timezone,
        currency: formData.currency,
        language: formData.language,
        notificationPreferences: {
          email: formData.emailNotifications,
          sms: formData.smsNotifications,
          push: formData.pushNotifications,
        },
      });
      
      // Clear the signup role from session storage
      sessionStorage.removeItem("tripweaver_signup_role");
      
      // Redirect to admin dashboard
      router.push("/admin");
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="relative z-10 max-w-2xl mx-auto pt-8">
        {/* Logo and Back to home */}
        <div className="flex items-center justify-between mb-10">
          <TripWeaverLogo size="md" />
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-400 transition-colors"
          >
            <Home className="w-4 h-4" />
            Back to home
          </Link>
        </div>

        {/* Compact Progress Bar */}
        <div className="flex items-center justify-center gap-0 mb-8">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-2 h-2 rounded-full transition-colors ${
                    currentStep > step.id
                      ? "bg-emerald-400"
                      : currentStep === step.id
                        ? "bg-emerald-400"
                        : "bg-slate-700"
                  }`}
                />
                <span
                  className={`text-xs font-medium transition-colors ${
                    currentStep >= step.id ? "text-emerald-400" : "text-slate-600"
                  }`}
                >
                  {step.title}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`w-10 h-px mx-3 transition-colors ${
                    currentStep > step.id ? "bg-emerald-600" : "bg-slate-800"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form Section */}
        <div>
          {/* Simple heading — no icon header */}
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-white">Complete Your Profile</h1>
            <p className="text-sm text-slate-500 mt-1">
              Step {currentStep} of 3: {STEPS[currentStep - 1].title}
            </p>
          </div>

          <div>
            <AnimatePresence mode="wait">
              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-xs font-medium text-slate-400">Full Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                      <Input
                        id="fullName"
                        placeholder="John Doe"
                        value={formData.fullName}
                        onChange={(e) => updateFormData("fullName", e.target.value)}
                        className="pl-10 h-11 bg-white/[0.02] border-white/[0.08] text-white placeholder:text-slate-600 focus-visible:border-emerald-500/40 focus-visible:ring-emerald-500/10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="text-xs font-medium text-slate-400">Company Name *</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                      <Input
                        id="companyName"
                        placeholder="Acme Corporation"
                        value={formData.companyName}
                        onChange={(e) => updateFormData("companyName", e.target.value)}
                        className="pl-10 h-11 bg-white/[0.02] border-white/[0.08] text-white placeholder:text-slate-600 focus-visible:border-emerald-500/40 focus-visible:ring-emerald-500/10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-xs font-medium text-slate-400">Department *</Label>
                    <Input
                      id="department"
                      placeholder="Operations, HR, Finance, etc."
                      value={formData.department}
                      onChange={(e) => updateFormData("department", e.target.value)}
                      className="h-11 bg-white/[0.02] border-white/[0.08] text-white placeholder:text-slate-600 focus-visible:border-emerald-500/40 focus-visible:ring-emerald-500/10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className="text-xs font-medium text-slate-400">Phone Number (Optional)</Label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                      <Input
                        id="phoneNumber"
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={formData.phoneNumber}
                        onChange={(e) => updateFormData("phoneNumber", e.target.value)}
                        className="pl-10 h-11 bg-white/[0.02] border-white/[0.08] text-white placeholder:text-slate-600 focus-visible:border-emerald-500/40 focus-visible:ring-emerald-500/10"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Profile Setup */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle" className="text-xs font-medium text-slate-400">Job Title *</Label>
                    <div className="relative">
                      <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                      <Input
                        id="jobTitle"
                        placeholder="Travel Manager, HR Director, etc."
                        value={formData.jobTitle}
                        onChange={(e) => updateFormData("jobTitle", e.target.value)}
                        className="pl-10 h-11 bg-white/[0.02] border-white/[0.08] text-white placeholder:text-slate-600 focus-visible:border-emerald-500/40 focus-visible:ring-emerald-500/10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone" className="text-xs font-medium text-slate-400">Timezone *</Label>
                    <Select
                      value={formData.timezone}
                      onValueChange={(value) => updateFormData("timezone", value)}
                    >
                      <SelectTrigger className="h-11 bg-white/[0.02] border-white/[0.08] text-white">
                        <Globe className="mr-2 h-4 w-4 text-slate-600" />
                        <SelectValue placeholder="Select your timezone" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0F172A] border-white/[0.06]">
                        {TIMEZONES.map((tz) => (
                          <SelectItem key={tz.value} value={tz.value} className="text-white hover:bg-white/[0.04]">
                            {tz.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Preferences */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currency" className="text-xs font-medium text-slate-400">Default Currency</Label>
                      <Select
                        value={formData.currency}
                        onValueChange={(value) => updateFormData("currency", value)}
                      >
                        <SelectTrigger className="h-11 bg-white/[0.02] border-white/[0.08] text-white">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0F172A] border-white/[0.06]">
                          {CURRENCIES.map((curr) => (
                            <SelectItem key={curr.value} value={curr.value} className="text-white hover:bg-white/[0.04]">
                              {curr.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="language" className="text-xs font-medium text-slate-400">Language</Label>
                      <Select
                        value={formData.language}
                        onValueChange={(value) => updateFormData("language", value)}
                      >
                        <SelectTrigger className="h-11 bg-white/[0.02] border-white/[0.08] text-white">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0F172A] border-white/[0.06]">
                          {LANGUAGES.map((lang) => (
                            <SelectItem key={lang.value} value={lang.value} className="text-white hover:bg-white/[0.04]">
                              {lang.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-xs font-medium text-slate-400">Notification Preferences</Label>
                    
                    <div className="flex items-center justify-between border border-white/[0.06] rounded-lg p-4 bg-white/[0.01]">
                      <div>
                        <p className="text-white font-medium">Email Notifications</p>
                        <p className="text-sm text-slate-400">Receive updates via email</p>
                      </div>
                      <Switch
                        checked={formData.emailNotifications}
                        onCheckedChange={(checked) => updateFormData("emailNotifications", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between border border-white/[0.06] rounded-lg p-4 bg-white/[0.01]">
                      <div>
                        <p className="text-white font-medium">SMS Notifications</p>
                        <p className="text-sm text-slate-400">Receive urgent alerts via SMS</p>
                      </div>
                      <Switch
                        checked={formData.smsNotifications}
                        onCheckedChange={(checked) => updateFormData("smsNotifications", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between border border-white/[0.06] rounded-lg p-4 bg-white/[0.01]">
                      <div>
                        <p className="text-white font-medium">Push Notifications</p>
                        <p className="text-sm text-slate-400">Receive in-app notifications</p>
                      </div>
                      <Switch
                        checked={formData.pushNotifications}
                        onCheckedChange={(checked) => updateFormData("pushNotifications", checked)}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="text-slate-400 disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              {currentStep < 3 ? (
                <Button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleComplete}
                  disabled={!canProceed() || isLoading}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    <>
                      Complete Setup
                      <CheckCircle2 className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
