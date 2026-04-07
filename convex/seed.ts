import { internalMutation } from "./_generated/server";

// One-time demo data seeder — call via MCP admin key
// Seeds only the event and policy; employees are created live during the demo.
export const seedDemoData = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Look up the admin user profile to use as createdBy
    const adminProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_role", (q) => q.eq("role", "admin"))
      .first();

    if (!adminProfile) {
      throw new Error("No admin profile found — complete admin onboarding first");
    }

    // ─── Clear existing demo data ────────────────────────────────────────────
    for (const t of await ctx.db.query("trips").collect()) {
      await ctx.db.delete(t._id);
    }
    for (const e of await ctx.db.query("events").collect()) {
      await ctx.db.delete(e._id);
    }
    for (const emp of await ctx.db.query("employees").collect()) {
      await ctx.db.delete(emp._id);
    }
    for (const it of await ctx.db.query("itineraries").collect()) {
      await ctx.db.delete(it._id);
    }
    for (const cr of await ctx.db.query("changeRequests").collect()) {
      await ctx.db.delete(cr._id);
    }
    for (const p of await ctx.db.query("policies").collect()) {
      await ctx.db.delete(p._id);
    }

    // ─── Dates ───────────────────────────────────────────────────────────────
    // Event: Stripe Sessions 2026, San Francisco, May 19–23 2026
    const departureDate = 1779148800000; // 2026-05-19 00:00 UTC
    const returnDate = 1779494400000;    // 2026-05-23 00:00 UTC

    // ─── Travel Policy ───────────────────────────────────────────────────────
    const _policyId = await ctx.db.insert("policies", {
      name: "Corporate Travel Standard",
      description: "Standard travel policy for all employees. Business class allowed for flights over 6 hours.",
      maxBudget: 5000,
      airlines: ["United Airlines", "Delta Air Lines", "American Airlines", "Southwest Airlines"],
      hotels: ["Marriott", "Hilton", "Hyatt", "Sheraton", "Westin"],
      mealAllowance: 75,
      groundTransport: 150,
      createdBy: adminProfile._id,
      createdAt: now,
      updatedAt: now,
    });

    // ─── Event: Stripe Sessions 2026 ─────────────────────────────────────────
    const eventId = await ctx.db.insert("events", {
      name: "Stripe Sessions 2026",
      destination: "San Francisco, CA",
      description: "Stripe's annual developer conference at Moscone Center. Key sessions on payments infrastructure, AI-powered fintech, and developer tools. All engineering and product team leads expected to attend.",
      departureDate,
      departureTime: "07:00",
      returnDate,
      budgetPerEmployee: 4500,
      totalBudget: 13500,
      employeeIds: [],
      status: "active",
      requirements: {
        cabinClass: "economy",
        requireDirectFlights: false,
        mealAllowancePerDay: 75,
        groundTransportLimit: 150,
        preferredHotels: ["Marriott", "Hilton", "Hyatt"],
        customRestrictions: "Ensure dietary restrictions are noted on all bookings.",
      },
      createdBy: adminProfile._id,
      sentAt: now - 86400000 * 2,
      createdAt: now - 86400000 * 3,
      updatedAt: now,
    });

    return {
      adminProfileId: adminProfile._id,
      eventId,
      message: "✅ Demo data seeded — event ready, no employees (add live during demo)",
    };
  },
});
