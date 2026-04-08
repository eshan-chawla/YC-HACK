'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { useConvexAuth, useConvex } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Button } from '@/components/ui/button'
import { TripWeaverLogo } from '@/components/TripWeaverLogo'
import { motion } from 'framer-motion'
import {
  ShieldCheck, UserCircle, Plane, Building2, CreditCard,
  BarChart3, Globe, ArrowRight, Loader2, Sparkles, CheckCircle2,
  Wand2, Leaf, Users
} from 'lucide-react'

const features = [
  {
    icon: Wand2,
    title: "AI-Powered Itineraries",
    description: "Smart flight and hotel recommendations personalized to each employee's preferences and your company policies.",
    accent: 'emerald' as const,
  },
  {
    icon: ShieldCheck,
    title: "Policy Automation",
    description: "Real-time compliance checking ensures every booking stays within budget and meets company guidelines.",
    accent: 'gold' as const,
  },
  {
    icon: UserCircle,
    title: "Personalized Experience",
    description: "Seating, dietary needs, loyalty programs, and accessibility — all accounted for automatically.",
    accent: 'emerald' as const,
  },
  {
    icon: Building2,
    title: "Multi-Team Management",
    description: "Separate budgets, policies, and approval workflows for every department in your organization.",
    accent: 'gold' as const,
  },
  {
    icon: CreditCard,
    title: "Expense Tracking",
    description: "Automatic receipt capture, real-time spend visibility, and seamless reconciliation for every trip.",
    accent: 'emerald' as const,
  },
  {
    icon: BarChart3,
    title: "Analytics & Insights",
    description: "Actionable data on travel spend patterns, savings opportunities, and policy compliance rates.",
    accent: 'gold' as const,
  },
]

const stats = [
  { value: "< 2min", label: "Full itinerary generation" },
  { value: "2 APIs", label: "Kiwi.com flights + Locus payments" },
  { value: "1 AI", label: "Gemini 2.5 Pro powering it all" },
]

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
}

/* Curved SVG divider pointing downward */
function WaveDividerDown({ from, to }: { from: string; to: string }) {
  return (
    <div className="relative w-full h-[100px] md:h-[140px] overflow-hidden" style={{ background: from }}>
      <svg
        className="absolute bottom-0 w-full h-full"
        preserveAspectRatio="none"
        viewBox="0 0 1440 140"
        fill="none"
      >
        <path
          d="M0 140H1440V42C1440 42 1163 -36 720 42C277 120 0 42 0 42V140Z"
          fill={to}
        />
      </svg>
    </div>
  )
}

/* Curved SVG divider pointing upward */
function WaveDividerUp({ from, to }: { from: string; to: string }) {
  return (
    <div className="relative w-full h-[100px] md:h-[140px] overflow-hidden" style={{ background: to }}>
      <svg
        className="absolute top-0 w-full h-full rotate-180"
        preserveAspectRatio="none"
        viewBox="0 0 1440 140"
        fill="none"
      >
        <path
          d="M0 140H1440V42C1440 42 1163 -36 720 42C277 120 0 42 0 42V140Z"
          fill={from}
        />
      </svg>
    </div>
  )
}

export default function LandingPage() {
  const { isSignedIn } = useAuth()
  const { isAuthenticated } = useConvexAuth()
  const convex = useConvex()
  const router = useRouter()
  const [redirectChecked, setRedirectChecked] = useState(false)
  const isRedirecting = useRef(false)

  useEffect(() => {
    if (!isSignedIn || !isAuthenticated) {
      setRedirectChecked(true)
      isRedirecting.current = false
      return
    }
    if (isRedirecting.current) return
    isRedirecting.current = true

    let cancelled = false
    convex.query(api.onboarding.getOnboardingStatus)
      .then((status) => {
        if (cancelled) return
        if (status) {
          if (status.onboardingCompleted) router.push(`/${status.role}`)
          else router.push(`/auth/onboarding/${status.role}`)
        } else {
          router.push('/auth/select-role')
        }
      })
      .catch(() => {
        isRedirecting.current = false
        setRedirectChecked(true)
      })
    return () => { cancelled = true }
  }, [isSignedIn, isAuthenticated, convex, router])

  if (isSignedIn && isAuthenticated && !redirectChecked) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center">
        <div className="icon-3d-emerald w-12 h-12">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-[#1a1c1a] overflow-hidden">

      {/* ── Navigation ──────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 nav-glaze">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-8 h-20 flex items-center justify-between">
          <TripWeaverLogo size="sm" />
          <div className="flex items-center gap-2">
            <Link href="/auth/login">
              <Button variant="ghost" className="text-gray-500 hover:text-[#1a1c1a] text-[13px] h-9 px-4 rounded-xl">
                Sign in
              </Button>
            </Link>
            <Link href="/auth/select-role">
              <Button className="btn-emerald-solid blob-2 text-[13px] h-9 px-5 font-medium btn-press">
                Get started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="relative pt-36 pb-24 lg:pt-48 lg:pb-36 px-6 lg:px-8">
        {/* Ambient orbs */}
        <div className="absolute top-0 left-[-200px] w-[600px] h-[600px] rounded-full bg-emerald-400/[0.08] blur-[150px] pointer-events-none" />
        <div className="absolute bottom-0 right-[-100px] w-[400px] h-[400px] rounded-full bg-yellow-400/[0.06] blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-[1200px] mx-auto grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Text column */}
          <div className="lg:col-span-7">
            <motion.div
              {...fadeUp}
              transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
              className="mb-8"
            >
              <span className="inline-flex items-center gap-2.5 px-4 py-2 paper-card blob-3">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[11px] font-semibold text-emerald-700 tracking-[0.08em] uppercase">AI-Powered Travel Platform</span>
              </span>
            </motion.div>

            <motion.h1
              {...fadeUp}
              transition={{ duration: 0.6, delay: 0.08, ease: [0.25, 0.1, 0.25, 1] }}
              className="font-serif text-[clamp(3rem,7vw,5.5rem)] leading-[1.02] tracking-[-0.03em] mb-7 text-[#1a1c1a]"
            >
              Corporate travel,{' '}
              <span className="italic bg-gradient-to-r from-emerald-700 to-emerald-500 bg-clip-text text-transparent">
                reimagined
              </span>
            </motion.h1>

            <motion.p
              {...fadeUp}
              transition={{ duration: 0.6, delay: 0.16, ease: [0.25, 0.1, 0.25, 1] }}
              className="text-lg md:text-xl text-gray-500 leading-relaxed max-w-xl mb-12"
            >
              TripWeaver uses AI to generate personalized itineraries, enforce policies automatically, and give your finance team full visibility — all in one platform.
            </motion.p>

            <motion.div
              {...fadeUp}
              transition={{ duration: 0.6, delay: 0.24, ease: [0.25, 0.1, 0.25, 1] }}
              className="flex flex-col sm:flex-row items-start gap-4"
            >
              <Link href="/auth/select-role">
                <Button size="lg" className="btn-emerald-solid blob-4 h-12 px-7 text-[14px] font-semibold group btn-press flex items-center gap-2">
                  Try the demo
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button variant="ghost" size="lg" className="paper-card blob-5 text-[#1a1c1a] h-12 px-7 text-[14px] font-semibold hover:text-emerald-700 transition-colors">
                  Sign in to your account
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Hero image column */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="lg:col-span-5 relative h-[400px] lg:h-[520px]"
          >
            <div className="absolute inset-0 paper-card blob-6 overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1542314831-c6a4d1409e1c?auto=format&fit=crop&w=1000&q=80"
                alt="Modern airport architecture"
                fill
                className="object-cover opacity-90 mix-blend-multiply transition-transform duration-700 hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 40vw"
                priority
              />
            </div>

            {/* Floating approval card */}
            <div className="absolute -bottom-6 -left-6 paper-card blob-2 p-4 flex items-center gap-4 z-20">
              <div className="w-11 h-11 paper-inset blob-1 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Flight Approved</p>
                <p className="font-serif font-medium text-base text-[#1a1c1a]">Paris → Tokyo</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Floating Stats Bar ──────────────────────────────────────── */}
      <div className="relative z-20 max-w-[1000px] mx-auto px-6 -mb-16">
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.6, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="paper-card blob-1 py-10 px-8 grid grid-cols-1 sm:grid-cols-3 gap-8 divide-y sm:divide-y-0 sm:divide-x divide-gray-200"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center justify-center text-center pt-4 sm:pt-0">
              <div className="font-serif text-[2.5rem] md:text-[3rem] text-[#1a1c1a] mb-1.5 leading-none tracking-[-0.02em]">
                {stat.value}
              </div>
              <div className="text-[12px] font-semibold text-gray-400 uppercase tracking-[0.08em]">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── Wave Divider: Ivory → Paper-dark ────────────────────────── */}
      <WaveDividerDown from="#fdfbf7" to="#f4f1ea" />

      {/* ── Features Section ────────────────────────────────────────── */}
      <section className="bg-[#f4f1ea] py-28 lg:py-36 px-6 lg:px-8 relative">
        {/* Subtle ambient white wash */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-white/40 blur-[150px] pointer-events-none" />

        <div className="max-w-[1200px] mx-auto relative z-10">
          <div className="text-center mb-20">
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5 }}
              className="font-serif text-[2.5rem] md:text-[3.5rem] tracking-[-0.02em] mb-5 leading-[1.05] text-[#1a1c1a]"
            >
              Everything your team needs
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="text-[15px] text-gray-500 leading-relaxed max-w-2xl mx-auto"
            >
              A unified platform that replaces spreadsheets, email chains, and fragmented booking tools.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className={`group paper-card ${i % 2 === 0 ? 'blob-4' : 'blob-2'} p-8 lg:p-9 flex flex-col`}
              >
                <div className={`w-14 h-14 paper-inset ${i % 3 === 0 ? 'blob-1' : i % 3 === 1 ? 'blob-3' : 'blob-6'} flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-500`}>
                  <feature.icon className={`w-6 h-6 ${feature.accent === 'gold' ? 'text-yellow-600' : 'text-emerald-600'}`} />
                </div>
                <h3 className="font-serif text-xl text-[#1a1c1a] mb-2.5 tracking-[-0.01em]">{feature.title}</h3>
                <p className="text-[13px] text-gray-500 leading-relaxed flex-grow">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Wave Divider: Paper-dark → Ivory ────────────────────────── */}
      <WaveDividerUp from="#f4f1ea" to="#fdfbf7" />

      {/* ── Role Cards — Asymmetric Overlapping ─────────────────────── */}
      <section className="py-28 lg:py-36 px-6 lg:px-8 relative">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5 }}
              className="font-serif text-[2.5rem] md:text-[3.5rem] tracking-[-0.02em] mb-5 leading-[1.05] text-[#1a1c1a]"
            >
              Built for your entire team
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="text-[15px] text-gray-500 leading-relaxed max-w-xl mx-auto"
            >
              Powerful controls for admins. A seamless, guided experience for employees.
            </motion.p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 lg:gap-6 items-stretch">
            {/* Admin Card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5 }}
              className="lg:w-[45%] relative"
            >
              <div className="paper-card blob-5 p-10 lg:p-12 h-full flex flex-col justify-center lg:translate-x-4 lg:-translate-y-6 relative z-10">
                <span className="inline-block px-3 py-1 bg-yellow-500/10 text-yellow-700 text-[10px] font-bold uppercase tracking-[0.1em] rounded-full mb-6 w-max">
                  For Admins
                </span>
                <h3 className="font-serif text-[1.75rem] lg:text-[2rem] text-[#1a1c1a] mb-4 tracking-[-0.02em]">
                  Control without friction
                </h3>
                <p className="text-[14px] text-gray-500 mb-7 leading-relaxed">
                  Full control over travel policies, budgets, approvals, and reporting — in one panoramic view.
                </p>

                <ul className="space-y-3.5 mb-9 text-[13px] text-[#1a1c1a] font-medium">
                  {["Configure policies and budgets", "Approve bookings and expenses", "View analytics and reports", "Manage team preferences"].map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-yellow-600 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>

                <Link href="/auth/signup/admin">
                  <Button variant="outline" className="w-full border-yellow-500/30 text-yellow-700 hover:bg-yellow-500 hover:text-yellow-950 hover:border-yellow-500 transition-all duration-300 text-[13px] h-10 blob-2 btn-press font-medium">
                    Get started as Admin
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Employee Card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="lg:w-[55%] relative"
            >
              <div className="paper-card blob-1 p-10 lg:p-14 h-full flex flex-col justify-center lg:-translate-x-4 lg:translate-y-8 relative z-10">
                <span className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-700 text-[10px] font-bold uppercase tracking-[0.1em] rounded-full mb-6 w-max">
                  For Employees
                </span>
                <h3 className="font-serif text-[1.75rem] lg:text-[2.5rem] text-[#1a1c1a] mb-4 tracking-[-0.02em]">
                  The upgrade they deserve
                </h3>
                <p className="text-[14px] lg:text-base text-gray-500 mb-7 leading-relaxed">
                  Personalized itineraries, AI travel assistant, and effortless expense tracking — all in a white-glove experience.
                </p>

                <div className="grid grid-cols-2 gap-4 mb-9">
                  <div className="paper-inset blob-3 p-4 flex flex-col items-center text-center">
                    <Plane className="w-6 h-6 text-emerald-600 mb-2" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">AI Itineraries</span>
                  </div>
                  <div className="paper-inset blob-6 p-4 flex flex-col items-center text-center">
                    <Users className="w-6 h-6 text-emerald-600 mb-2" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Travel Assistant</span>
                  </div>
                </div>

                <Link href="/auth/signup/employee">
                  <Button className="w-full btn-emerald-solid blob-4 text-[13px] h-10 btn-press font-medium">
                    Get started as Employee
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Final CTA — Paper Sculpture ─────────────────────────────── */}
      <section className="py-28 lg:py-36 px-6 lg:px-8 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-emerald-400/[0.06] blur-[150px] pointer-events-none" />

        <div className="max-w-[900px] mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="paper-card blob-3 p-12 lg:p-20 text-center relative overflow-hidden"
          >
            {/* Watermark decoration */}
            <Plane className="absolute -top-4 -right-4 w-64 h-64 text-[#f4f1ea] rotate-12 pointer-events-none opacity-60" />

            <div className="relative z-10">
              <h2 className="font-serif text-[2.5rem] md:text-[3.5rem] tracking-[-0.02em] mb-5 leading-[1.05] text-[#1a1c1a]">
                Ready to modernize your
                <br />
                <span className="italic text-emerald-700">corporate travel?</span>
              </h2>
              <p className="text-[15px] text-gray-500 mb-10 max-w-xl mx-auto">
                A demo built for the Locus (YC F25) Agentic Payments Hackathon.
              </p>
              <Link href="/auth/select-role">
                <Button size="lg" className="btn-emerald-solid blob-2 h-12 px-8 text-[14px] font-semibold group btn-press flex items-center gap-2 mx-auto">
                  Try the demo
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="py-12 px-6 lg:px-8 border-t border-gray-200 mx-6 lg:mx-8">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <TripWeaverLogo size="sm" />
          <p className="text-[12px] text-gray-400 text-center">
            Built for Stripe Sessions 2026 · Gemini 2.5 Pro × Convex × Locus
          </p>
        </div>
      </footer>
    </div>
  )
}
