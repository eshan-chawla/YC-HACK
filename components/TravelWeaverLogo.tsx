'use client'

import { cn } from '@/lib/utils'

interface TravelWeaverLogoProps {
  variant?: 'full' | 'icon' | 'text'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
}

export function TravelWeaverLogo({ 
  variant = 'full', 
  size = 'md',
  className,
  text = 'TripWeaver'
}: TravelWeaverLogoProps) {
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg'
  }

  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  const LogoIcon = () => (
    <div className={cn(
      iconSizes[size],
      'rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg',
      'ring-2 ring-green-400/20'
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
    <div className="flex flex-col">
      <span className={cn(
        'font-bold tracking-tight',
        'bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent',
        sizeClasses[size]
      )}>
        {text}
      </span>
    </div>
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

