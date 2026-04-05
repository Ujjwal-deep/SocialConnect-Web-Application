import React from 'react'
import { Spinner } from '@/components/ui/Spinner'

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-base/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        {/* We use xl for a prominent global loading state */}
        <Spinner size="xl" />
        <p className="t-muted animate-pulse" style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
          Loading...
        </p>
      </div>
    </div>
  )
}
