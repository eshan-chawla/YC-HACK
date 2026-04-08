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
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { TripWeaverLogo } from "@/components/TripWeaverLogo";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  User,
  Building2,
  Users,
  Phone,
  Plane,
  Utensils,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Plus,
  X,
  Check,
  Home,
} from "lucide-react";

const STEPS = [
  { id: 1, title: "Basic Info", icon: User },
  { id: 2, title: "Travel Preferences", icon: Plane },
  { id: 3, title: "Accessibility & Dietary", icon: Utensils },
];

const SEATING_PREFERENCES = [
  { value: "window", label: "Window" },
  { value: "aisle", label: "Aisle" },
  { value: "middle", label: "Middle" },
  { value: "no_preference", label: "No Preference" },
];

const DIETARY_OPTIONS = [
  "Vegetarian",
  "Vegan",
  "Gluten-Free",
  "Halal",
  "Kosher",
  "Dairy-Free",
  "Nut-Free",
  "Pescatarian",
  "Low-Sodium",
];

const MOBILITY_OPTIONS = [
  { value: "none", label: "No special requirements" },
  { value: "wheelchair", label: "Wheelchair accessible" },
  { value: "limited_mobility", label: "Limited mobility assistance" },
  { value: "other", label: "Other (specify in notes)" },
];

const HOTEL_PREFERENCES = [
  "Non-smoking room",
  "Ground floor",
  "High floor",
  "Quiet room",
  "Near elevator",
  "Accessible room",
  "King bed",
  "Two beds",
];

export default function EmployeeOnboardingPage() {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const status = useQuery(api.onboarding.getOnboardingStatus);
  const completeOnboarding = useMutation(api.onboarding.completeEmployeeOnboarding);

  // Already onboarded: go to dashboard
  useEffect(() => {
    if (isAuthenticated && status !== undefined && status?.onboardingCompleted) {
      router.replace(`/employee`);
    }
  }, [isAuthenticated, status, router]);

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    fullName: "",
    department: "",
    team: "",
    manager: "",
    phoneNumber: "",

    // Step 2: Travel Preferences
    seatingPreference: "no_preference",
    frequentFlyerNumbers: [] as { airline: string; number: string }[],

    // Step 3: Accessibility & Dietary
    dietaryRestrictions: [] as string[],
    mobilityNeeds: "none",
    hotelPreferences: [] as string[],
    additionalNotes: "",
  });

  const [newFrequentFlyer, setNewFrequentFlyer] = useState({ airline: "", number: "" });

  const updateFormData = (field: string, value: string | string[] | { airline: string; number: string }[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleDietaryRestriction = (restriction: string) => {
    const current = formData.dietaryRestrictions;
    if (current.includes(restriction)) {
      updateFormData("dietaryRestrictions", current.filter(r => r !== restriction));
    } else {
      updateFormData("dietaryRestrictions", [...current, restriction]);
    }
  };

  const toggleHotelPreference = (preference: string) => {
    const current = formData.hotelPreferences;
    if (current.includes(preference)) {
      updateFormData("hotelPreferences", current.filter(p => p !== preference));
    } else {
      updateFormData("hotelPreferences", [...current, preference]);
    }
  };

  const addFrequentFlyer = () => {
    if (newFrequentFlyer.airline && newFrequentFlyer.number) {
      updateFormData("frequentFlyerNumbers", [...formData.frequentFlyerNumbers, newFrequentFlyer]);
      setNewFrequentFlyer({ airline: "", number: "" });
    }
  };

  const removeFrequentFlyer = (index: number) => {
    updateFormData("frequentFlyerNumbers", formData.frequentFlyerNumbers.filter((_, i) => i !== index));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.fullName && formData.department;
      case 2:
        return true; // All optional
      case 3:
        return true; // All optional
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

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      await completeOnboarding({
        fullName: formData.fullName,
        department: formData.department,
        team: formData.team || undefined,
        manager: formData.manager || undefined,
        phoneNumber: formData.phoneNumber || undefined,
        seatingPreference: formData.seatingPreference,
        dietaryRestrictions: formData.dietaryRestrictions,
        mobilityNeeds: formData.mobilityNeeds === "none" ? undefined : formData.mobilityNeeds,
        hotelPreferences: formData.hotelPreferences,
        frequentFlyerNumbers: formData.frequentFlyerNumbers.length > 0 ? formData.frequentFlyerNumbers : undefined,
        additionalNotes: formData.additionalNotes || undefined,
      });

      // Clear the signup role from session storage
      sessionStorage.removeItem("tripweaver_signup_role");

      // Redirect to employee dashboard
      router.push("/employee");
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Wait for auth/status before showing form (avoid flash then redirect)
  if (isAuthenticated && status === undefined) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  const inputClasses = "pl-10 h-11 bg-white/80 border-black/[0.08] text-foreground placeholder:text-muted-foreground/50 focus-visible:border-emerald-500/40 focus-visible:ring-emerald-500/10 rounded-xl";
  const inputNoIconClasses = "h-11 bg-white/80 border-black/[0.08] text-foreground placeholder:text-muted-foreground/50 focus-visible:border-emerald-500/40 focus-visible:ring-emerald-500/10 rounded-xl";

  return (
    <div className="min-h-screen bg-[#faf9f7] p-4 relative overflow-hidden">
      {/* Ambient decorative blobs */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-emerald-100/40 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-8%] w-[400px] h-[400px] rounded-full bg-amber-100/30 blur-3xl pointer-events-none" />

      <div className="max-w-2xl mx-auto pt-8 relative z-10">
        {/* Logo and Back to home */}
        <div className="flex items-center justify-between mb-10">
          <TripWeaverLogo size="md" />
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-emerald-600 transition-colors"
          >
            <Home className="w-4 h-4" />
            Back to home
          </Link>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-center mb-10">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  currentStep > step.id
                    ? "bg-emerald-600 text-white"
                    : currentStep === step.id
                      ? "border-2 border-emerald-500/40 text-emerald-600 bg-white"
                      : "bg-black/[0.06] text-muted-foreground"
                }`}>
                  {currentStep > step.id ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    step.id
                  )}
                </div>
                <span className={`hidden sm:inline text-xs font-medium ${
                  currentStep >= step.id ? "text-emerald-600" : "text-muted-foreground"
                }`}>
                  {step.title}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div className={`w-10 sm:w-16 h-px mx-3 transition-colors ${
                  currentStep > step.id ? "bg-emerald-600" : "bg-black/[0.08]"
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Form Section */}
        <div className="paper-card rounded-2xl p-6 sm:p-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-title text-foreground">Complete Your Profile</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Step {currentStep} of 3: {STEPS[currentStep - 1].title}
            </p>
          </div>

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
                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className="text-xs font-medium text-muted-foreground">Full Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                    <Input
                      id="fullName"
                      placeholder="John Doe"
                      value={formData.fullName}
                      onChange={(e) => updateFormData("fullName", e.target.value)}
                      className={inputClasses}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="department" className="text-xs font-medium text-muted-foreground">Department *</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                    <Input
                      id="department"
                      placeholder="Engineering, Sales, Marketing, etc."
                      value={formData.department}
                      onChange={(e) => updateFormData("department", e.target.value)}
                      className={inputClasses}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="team" className="text-xs font-medium text-muted-foreground">Team (Optional)</Label>
                  <div className="relative">
                    <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                    <Input
                      id="team"
                      placeholder="Frontend, West Coast, etc."
                      value={formData.team}
                      onChange={(e) => updateFormData("team", e.target.value)}
                      className={inputClasses}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="manager" className="text-xs font-medium text-muted-foreground">Manager (Optional)</Label>
                  <Input
                    id="manager"
                    placeholder="Manager's name"
                    value={formData.manager}
                    onChange={(e) => updateFormData("manager", e.target.value)}
                    className={inputNoIconClasses}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phoneNumber" className="text-xs font-medium text-muted-foreground">Phone Number (Optional)</Label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                    <Input
                      id="phoneNumber"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={formData.phoneNumber}
                      onChange={(e) => updateFormData("phoneNumber", e.target.value)}
                      className={inputClasses}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Travel Preferences */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="space-y-1.5">
                  <Label htmlFor="seatingPreference" className="text-xs font-medium text-muted-foreground">Seating Preference</Label>
                  <Select
                    value={formData.seatingPreference}
                    onValueChange={(value) => updateFormData("seatingPreference", value)}
                  >
                    <SelectTrigger className="h-11 bg-white/80 border-black/[0.08] text-foreground rounded-xl">
                      <SelectValue placeholder="Select preference" />
                    </SelectTrigger>
                    <SelectContent>
                      {SEATING_PREFERENCES.map((pref) => (
                        <SelectItem key={pref.value} value={pref.value}>
                          {pref.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-medium text-muted-foreground">Frequent Flyer Numbers (Optional)</Label>

                  {formData.frequentFlyerNumbers.map((ff, index) => (
                    <div key={index} className="flex items-center gap-2 border border-black/[0.06] rounded-xl p-3 bg-white/60">
                      <span className="text-foreground text-sm flex-1">{ff.airline}: {ff.number}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFrequentFlyer(index)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}

                  <div className="flex gap-2">
                    <Input
                      placeholder="Airline"
                      value={newFrequentFlyer.airline}
                      onChange={(e) => setNewFrequentFlyer(prev => ({ ...prev, airline: e.target.value }))}
                      className={inputNoIconClasses}
                    />
                    <Input
                      placeholder="Member Number"
                      value={newFrequentFlyer.number}
                      onChange={(e) => setNewFrequentFlyer(prev => ({ ...prev, number: e.target.value }))}
                      className={inputNoIconClasses}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addFrequentFlyer}
                      disabled={!newFrequentFlyer.airline || !newFrequentFlyer.number}
                      className="h-11 border-black/[0.08] text-muted-foreground hover:bg-muted/50 rounded-xl"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Accessibility & Dietary */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="space-y-3">
                  <Label className="text-xs font-medium text-muted-foreground">Dietary Restrictions</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {DIETARY_OPTIONS.map((option) => (
                      <div
                        key={option}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`dietary-${option}`}
                          checked={formData.dietaryRestrictions.includes(option)}
                          onCheckedChange={() => toggleDietaryRestriction(option)}
                          className="border-black/[0.12] data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                        />
                        <label
                          htmlFor={`dietary-${option}`}
                          className="text-sm text-foreground/80 cursor-pointer"
                        >
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="mobilityNeeds" className="text-xs font-medium text-muted-foreground">Mobility Needs</Label>
                  <Select
                    value={formData.mobilityNeeds}
                    onValueChange={(value) => updateFormData("mobilityNeeds", value)}
                  >
                    <SelectTrigger className="h-11 bg-white/80 border-black/[0.08] text-foreground rounded-xl">
                      <SelectValue placeholder="Select if applicable" />
                    </SelectTrigger>
                    <SelectContent>
                      {MOBILITY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-medium text-muted-foreground">Hotel Preferences</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {HOTEL_PREFERENCES.map((option) => (
                      <div
                        key={option}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`hotel-${option}`}
                          checked={formData.hotelPreferences.includes(option)}
                          onCheckedChange={() => toggleHotelPreference(option)}
                          className="border-black/[0.12] data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                        />
                        <label
                          htmlFor={`hotel-${option}`}
                          className="text-sm text-foreground/80 cursor-pointer"
                        >
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="additionalNotes" className="text-xs font-medium text-muted-foreground">Additional Notes (Optional)</Label>
                  <Textarea
                    id="additionalNotes"
                    placeholder="Any other travel preferences or requirements..."
                    value={formData.additionalNotes}
                    onChange={(e) => updateFormData("additionalNotes", e.target.value)}
                    className="bg-white/80 border-black/[0.08] text-foreground placeholder:text-muted-foreground/50 min-h-[100px] focus-visible:border-emerald-500/40 focus-visible:ring-emerald-500/10 rounded-xl"
                  />
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
              className="text-muted-foreground disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            {currentStep < 3 ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="btn-emerald-solid rounded-xl px-6"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={!canProceed() || isLoading}
                className="btn-emerald-solid rounded-xl px-6"
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
  );
}
