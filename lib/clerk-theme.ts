/**
 * Shared Clerk appearance config for all dark-themed auth pages.
 * Used by: login, signup/admin, signup/employee
 */
export const clerkDarkAppearance = {
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
    footerActionLink: "text-emerald-400 hover:text-emerald-300 font-medium",
    identityPreviewEditButton: "text-emerald-400",
    formFieldAction: "text-emerald-400",
    footer: "hidden",
  },
} as const
