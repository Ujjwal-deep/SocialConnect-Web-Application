'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { Spinner } from '@/components/ui/Spinner'

interface LoadingContextType {
  startLoading: () => void
  stopLoading: () => void
  isLoading: boolean
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const startLoading = useCallback(() => setIsLoading(true), [])
  const stopLoading = useCallback(() => setIsLoading(false), [])

  // Stop loading whenever the URL changes
  useEffect(() => {
    stopLoading()
  }, [pathname, searchParams, stopLoading])

  return (
    <LoadingContext.Provider value={{ startLoading, stopLoading, isLoading }}>
      {children}
      {isLoading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-surface-base/60 backdrop-blur-sm transition-opacity duration-300">
          <div className="flex flex-col items-center gap-4">
            <Spinner size="xl" />
            <p className="t-muted animate-pulse" style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
              Navigating...
            </p>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  )
}

export function useLoading() {
  const context = useContext(LoadingContext)
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider')
  }
  return context
}
