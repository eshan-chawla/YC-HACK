'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { TripWeaverLogo } from '@/components/TripWeaverLogo'
import { motion } from 'framer-motion'
import { ShieldCheck, UserCircle, Plane, Building2, CreditCard, BarChart3, Globe, ArrowRight, Lock, Zap, Clock } from 'lucide-react'

const features = [
  {
    icon: Plane,
    title: "AI-Powered Itineraries",
    description: "Smart flight and hotel recommendations personalized to each employee's preferences and your company policies."
  },
  {
    icon: ShieldCheck,
    title: "Policy Automation",
    description: "Real-time compliance checking that ensures every booking stays within budget and meets company guidelines."
  },
  {
    icon: UserCircle,
    title: "Personalized Experience",
    description: "Seating, dietary requirements, loyalty programs, and accessibility needs — all accounted for automatically."
  },
  {
    icon: Building2,
    title: "Multi-Team Management",
    description: "Separate budgets, policies, and approval workflows for every department in your organization."
  },
  {
    icon: CreditCard,
    title: "Expense Tracking",
    description: "Automatic receipt capture, real-time spend visibility, and seamless reconciliation for every trip."
  },
  {
    icon: BarChart3,
    title: "Analytics & Insights",
    description: "Actionable data on travel spend patterns, savings opportunities, and policy compliance rates."
  }
]

const stats = [
  { value: "40%", label: "Average savings on corporate travel" },
  { value: "< 2min", label: "Time to generate a full itinerary" },
  { value: "99.9%", label: "Platform uptime guarantee" },
]

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 overflow-hidden">
      {/* Grain texture overlay */}
      <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.015]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")', backgroundRepeat: 'repeat', backgroundSize: '128px 128px' }} />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#020617]/80 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <TripWeaverLogo size="sm" />
          <div className="flex items-center gap-2">
            <Link href="/auth/login">
              <Button variant="ghost" className="text-slate-400 hover:text-white text-sm">
                Sign in
              </Button>
            </Link>
            <Link href="/auth/select-role">
              <Button className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm h-9 px-4 shadow-lg shadow-emerald-900/30">
                Get started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-36 pb-24 lg:pt-48 lg:pb-36 px-6 lg:px-8">
        {/* Subtle top glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-500/[0.06] rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-[1200px] mx-auto">
          <div className="max-w-3xl">
            <motion.div
              {...fadeUp}
              transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
              className="mb-6"
            >
              <span className="inline-flex items-center gap-2 text-xs font-medium text-emerald-400/80 tracking-widest uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                AI-Powered Travel Platform
              </span>
            </motion.div>

            <motion.h1
              {...fadeUp}
              transition={{ duration: 0.6, delay: 0.08, ease: [0.25, 0.1, 0.25, 1] }}
              className="text-[clamp(2.5rem,6vw,4.5rem)] font-extrabold leading-[1.05] tracking-[-0.035em] mb-6"
            >
              Corporate travel,{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
                reimagined
              </span>
            </motion.h1>

            <motion.p
              {...fadeUp}
              transition={{ duration: 0.6, delay: 0.16, ease: [0.25, 0.1, 0.25, 1] }}
              className="text-lg md:text-xl text-slate-400 leading-relaxed max-w-xl mb-10"
            >
              TripWeaver uses AI to generate personalized itineraries, enforce policies automatically, and give your finance team full visibility — all in one platform.
            </motion.p>

            <motion.div
              {...fadeUp}
              transition={{ duration: 0.6, delay: 0.24, ease: [0.25, 0.1, 0.25, 1] }}
              className="flex flex-col sm:flex-row items-start gap-4"
            >
              <Link href="/auth/select-role">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white h-12 px-7 text-[15px] shadow-xl shadow-emerald-900/30 group">
                  Start for free
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button variant="ghost" size="lg" className="text-slate-400 hover:text-white h-12 px-7 text-[15px]">
                  Sign in to your account
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Stats row */}
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="mt-20 pt-10 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-3 gap-8"
          >
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-1">{stat.value}</div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="py-16 px-6 lg:px-8 border-y border-white/[0.04]">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-sm text-slate-500">
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-emerald-500/70" />
              <span>Enterprise-grade security</span>
            </div>
            <div className="w-px h-4 bg-white/[0.06] hidden sm:block" />
            <div className="flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-emerald-500/70" />
              <span>99.9% uptime SLA</span>
            </div>
            <div className="w-px h-4 bg-white/[0.06] hidden sm:block" />
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500/70" />
              <span>SOC 2 Type II compliant</span>
            </div>
            <div className="w-px h-4 bg-white/[0.06] hidden sm:block" />
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-emerald-500/70" />
              <span>24/7 support</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-28 lg:py-36 px-6 lg:px-8">
        <div className="max-w-[1200px] mx-auto">
          <div className="max-w-xl mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5 }}
              className="text-3xl md:text-4xl font-extrabold tracking-[-0.02em] mb-4"
            >
              Everything your team needs
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="text-lg text-slate-400 leading-relaxed"
            >
              A unified platform that replaces spreadsheets, email chains, and fragmented booking tools.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/[0.04] rounded-2xl overflow-hidden border border-white/[0.04]">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="group bg-[#020617] p-8 lg:p-10 hover:bg-slate-900/50 transition-colors duration-300"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-5 group-hover:bg-emerald-500/15 transition-colors duration-300">
                  <feature.icon className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2 tracking-[-0.01em]">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Role Cards */}
      <section className="py-28 lg:py-36 px-6 lg:px-8">
        <div className="max-w-[1200px] mx-auto">
          <div className="max-w-xl mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5 }}
              className="text-3xl md:text-4xl font-extrabold tracking-[-0.02em] mb-4"
            >
              Built for your entire team
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="text-lg text-slate-400 leading-relaxed"
            >
              Powerful controls for admins. A seamless, guided experience for employees.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Admin */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5 }}
              className="group relative rounded-2xl border border-white/[0.06] bg-slate-900/30 p-8 lg:p-10 hover:border-emerald-500/20 transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-6">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold mb-2 tracking-[-0.01em]">For Admins</h3>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">Full control over travel policies, budgets, approvals, and reporting.</p>
              <ul className="space-y-3 mb-8">
                {["Configure policies and budgets", "Approve bookings and expenses", "View analytics and reports", "Manage team preferences"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-slate-300">
                    <div className="w-1 h-1 rounded-full bg-emerald-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/auth/signup/admin">
                <Button variant="outline" className="w-full border-white/10 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all duration-200 text-sm">
                  Get started as Admin
                </Button>
              </Link>
            </motion.div>

            {/* Employee */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="group relative rounded-2xl border border-white/[0.06] bg-slate-900/30 p-8 lg:p-10 hover:border-emerald-500/20 transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-6">
                <Globe className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold mb-2 tracking-[-0.01em]">For Employees</h3>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">Personalized itineraries, AI travel assistant, and effortless expense tracking.</p>
              <ul className="space-y-3 mb-8">
                {["View personalized itineraries", "Chat with AI travel assistant", "Set your travel preferences", "Submit and track expenses"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-slate-300">
                    <div className="w-1 h-1 rounded-full bg-emerald-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/auth/signup/employee">
                <Button variant="outline" className="w-full border-white/10 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all duration-200 text-sm">
                  Get started as Employee
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-28 lg:py-36 px-6 lg:px-8 border-t border-white/[0.04]">
        <div className="max-w-2xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-extrabold tracking-[-0.02em] mb-4"
          >
            Ready to modernize your
            <br />
            corporate travel?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="text-lg text-slate-400 mb-10"
          >
            Join companies saving time and money with TripWeaver.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Link href="/auth/select-role">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white h-12 px-8 text-[15px] shadow-xl shadow-emerald-900/30 group">
                Get started for free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 lg:px-8 border-t border-white/[0.04]">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-14">
            <div>
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-4">Product</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="#" className="text-slate-500 hover:text-slate-300 transition-colors">Features</Link></li>
                <li><Link href="#" className="text-slate-500 hover:text-slate-300 transition-colors">Pricing</Link></li>
                <li><Link href="#" className="text-slate-500 hover:text-slate-300 transition-colors">Security</Link></li>
                <li><Link href="#" className="text-slate-500 hover:text-slate-300 transition-colors">Integrations</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-4">Company</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="#" className="text-slate-500 hover:text-slate-300 transition-colors">About</Link></li>
                <li><Link href="#" className="text-slate-500 hover:text-slate-300 transition-colors">Blog</Link></li>
                <li><Link href="#" className="text-slate-500 hover:text-slate-300 transition-colors">Careers</Link></li>
                <li><Link href="#" className="text-slate-500 hover:text-slate-300 transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-4">Resources</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="#" className="text-slate-500 hover:text-slate-300 transition-colors">Documentation</Link></li>
                <li><Link href="#" className="text-slate-500 hover:text-slate-300 transition-colors">Help Center</Link></li>
                <li><Link href="#" className="text-slate-500 hover:text-slate-300 transition-colors">API Reference</Link></li>
                <li><Link href="#" className="text-slate-500 hover:text-slate-300 transition-colors">Status</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-4">Legal</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="#" className="text-slate-500 hover:text-slate-300 transition-colors">Privacy</Link></li>
                <li><Link href="#" className="text-slate-500 hover:text-slate-300 transition-colors">Terms</Link></li>
                <li><Link href="#" className="text-slate-500 hover:text-slate-300 transition-colors">Cookies</Link></li>
                <li><Link href="#" className="text-slate-500 hover:text-slate-300 transition-colors">GDPR</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/[0.04] flex flex-col md:flex-row items-center justify-between gap-4">
            <TripWeaverLogo size="sm" />
            <p className="text-xs text-slate-600">
              &copy; {new Date().getFullYear()} TripWeaver. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
