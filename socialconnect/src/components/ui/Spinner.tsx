import React from 'react'

/**
 * Luma Spinner component adapted for the Amber Noir design system.
 * Replaces the generic lucide-react Loader2.
 */
interface SpinnerProps {
  /** Size multiplier. 'md' is default and roughly limits to ~32px visually. 'sm' is ~16px for buttons. */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Optional additional classes for the outer wrapper */
  className?: string
  /** Whether to use the layout constraint or just visually scale */
  constrainLayout?: boolean
}

export function Spinner({ size = 'md', className = '', constrainLayout = true }: SpinnerProps) {
  // Scale transforms don't change layout size, so we constrain the outer flex box
  // to avoid large empty spaces when scaled down.
  const layoutConstraints = {
    sm: 'w-[16px] h-[16px]',
    md: 'w-[32px] h-[32px]',
    lg: 'w-[48px] h-[48px]',
    xl: 'w-[65px] h-[65px]'
  }

  const visualScale = {
    sm: 'scale-[0.25]', // 65 * 0.25 = 16.25px
    md: 'scale-[0.5]',  // 65 * 0.5 = 32.5px
    lg: 'scale-[0.75]', // 65 * 0.75 = 48.75px
    xl: 'scale-100'     // 65px
  }

  return (
    <div 
      className={`relative flex items-center justify-center ${constrainLayout ? layoutConstraints[size] : ''} ${className}`}
      aria-label="Loading..."
      role="status"
    >
      <div className={`relative w-[65px] h-[65px] shrink-0 origin-center ${visualScale[size]}`}>
        <span className="absolute rounded-[50px] luma-spin-anim luma-shadow" />
        <span className="absolute rounded-[50px] luma-spin-anim animation-delay-luma luma-shadow" />
      </div>
    </div>
  )
}
