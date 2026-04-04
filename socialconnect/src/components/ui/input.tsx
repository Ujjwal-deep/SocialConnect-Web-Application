import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Base
        "w-full min-w-0 rounded-[10px] border bg-[#232018] px-4 py-[0.6875rem] text-[0.9375rem] text-[#F5EDD8] transition-all outline-none",
        // Border
        "border-[#2E2A22] hover:border-[#4A3F2E]",
        // Focus — amber ring, NO browser blue
        "focus:border-[#EF9F27] focus:shadow-[0_0_0_3px_rgba(239,159,39,0.12)]",
        // Placeholder
        "placeholder:text-[#6B5F50]",
        // Validation error state (set via aria-invalid by react-hook-form)
        "aria-invalid:border-[#E24B4A] aria-invalid:focus:shadow-[0_0_0_3px_rgba(226,75,74,0.12)]",
        // Disabled
        "disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
