'use client'

import { cn } from '@/lib/utils'

interface TripWeaverLogoProps {
  variant?: 'full' | 'icon' | 'text'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
}

export function TripWeaverLogo({ 
  variant = 'full', 
  size = 'md',
  className,
  text = 'TripWeaver'
}: TripWeaverLogoProps) {
  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl'
  }

  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12'
  }

  const LogoIcon = () => (
    <div className={cn(
      iconSizes[size],
      'rounded-lg bg-emerald-600 flex items-center justify-center'
    )}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="w-full h-full p-1.5"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 2L2 7L12 12L22 7L12 2Z"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="white"
          fillOpacity="0.9"
        />
        <path
          d="M2 17L12 22L22 17"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M2 12L12 17L22 12"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  )

  const LogoText = () => (
    <span className={cn(
      'font-bold tracking-[-0.02em] text-foreground',
      textSizes[size]
    )}>
      {text}
    </span>
  )

  if (variant === 'icon') {
    return <LogoIcon />
  }

  if (variant === 'text') {
    return <LogoText />
  }

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <LogoIcon />
      <LogoText />
    </div>
  )
}
