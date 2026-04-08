/**
 * Shared Clerk appearance config for light luxury auth pages.
 * Uses warm ivory paper-card aesthetic with emerald accents.
 * Used by: login, signup/admin, signup/employee
 */
export const clerkDarkAppearance = {
  elements: {
    rootBox: "w-full",
    card: "bg-transparent shadow-none p-0 w-full",
    headerTitle: "hidden",
    headerSubtitle: "hidden",
    socialButtonsBlockButton:
      "h-11 border-black/[0.08] bg-white/80 hover:bg-white text-foreground shadow-sm",
    socialButtonsBlockButtonText: "text-foreground font-medium",
    dividerLine: "bg-black/[0.08]",
    dividerText: "text-muted-foreground text-xs uppercase tracking-wider",
    formFieldLabel: "text-xs font-medium text-muted-foreground",
    formFieldInput:
      "h-11 bg-white/80 border-black/[0.08] text-foreground placeholder:text-muted-foreground/50 focus:border-emerald-500/40 focus:ring-emerald-500/10",
    formButtonPrimary:
      "h-11 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20",
    footerActionLink: "text-emerald-600 hover:text-emerald-500 font-medium",
    identityPreviewEditButton: "text-emerald-600",
    formFieldAction: "text-emerald-600",
    footer: "hidden",
  },
} as const
