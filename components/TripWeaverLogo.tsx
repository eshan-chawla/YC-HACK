'use client'

import { cn } from '@/lib/utils'

interface TripWeaverLogoProps {
  variant?: 'full' | 'icon' | 'text'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
}

const ICON_SIZES = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-14 h-14',
}

const TEXT_SIZES = {
  sm: 'text-[15px]',
  md: 'text-[17px]',
  lg: 'text-[22px]',
}

/**
 * Airplane glyph designed to remain legible at 20px:
 * - 3 bold ellipse shapes (fuselage, main wings, tail)
 * - solid white fill, no opacity tricks
 * - pointed nose polygon
 */
function PlaneGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="white"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="w-[58%] h-[58%]"
    >
      {/* Nose point */}
      <polygon points="12,2 10.2,5.5 13.8,5.5" />
      {/* Fuselage */}
      <ellipse cx="12" cy="11.5" rx="1.9" ry="7" />
      {/* Main wings */}
      <ellipse cx="12" cy="11" rx="9.5" ry="2.6" />
      {/* Tail stabilisers */}
      <ellipse cx="12" cy="17.5" rx="4.8" ry="1.6" />
    </svg>
  )
}

export function TripWeaverLogo({
  variant = 'full',
  size = 'md',
  className,
  text = 'TripWeaver',
}: TripWeaverLogoProps) {
  const LogoIcon = () => (
    <div
      className={cn(
        ICON_SIZES[size],
        'shrink-0 rounded-[10px]',
        'bg-gradient-to-br from-emerald-500 to-emerald-700',
        'shadow-[0_3px_10px_-2px_rgba(5,150,105,0.55),inset_0_1px_0_rgba(255,255,255,0.2)]',
        'flex items-center justify-center'
      )}
    >
      <PlaneGlyph />
    </div>
  )

  const LogoText = () => (
    <span
      className={cn(
        'font-semibold tracking-[-0.02em] leading-none select-none',
        'text-stone-900',
        TEXT_SIZES[size]
      )}
    >
      Trip
      <span className="font-black text-emerald-600">Weaver</span>
    </span>
  )

  if (variant === 'icon') return <LogoIcon />
  if (variant === 'text') return <LogoText />

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <LogoIcon />
      <LogoText />
    </div>
  )
}
