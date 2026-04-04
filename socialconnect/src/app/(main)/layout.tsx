import React from 'react'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-surface-base">
      {/* 
          Shell Layout — Placeholder 
          Full sidebar and navbar will be implemented in Phase 3.
      */}
      <main>
        {children}
      </main>
    </div>
  )
}
