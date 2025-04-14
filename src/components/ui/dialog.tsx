import * as React from "react"
import { combineClasses } from "@/lib/utils"

interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onOpenChange?.(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg mx-4">
        {children}
      </div>
    </div>
  )
}

const DialogContent = ({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={combineClasses("relative", className)} {...props}>
      {children}
    </div>
  )
}

const DialogHeader = ({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={combineClasses("mb-4", className)} {...props}>
      {children}
    </div>
  )
}

const DialogTitle = ({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => {
  return (
    <h2 className={combineClasses("text-lg font-semibold", className)} {...props}>
      {children}
    </h2>
  )
}

const DialogDescription = ({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => {
  return (
    <p className={combineClasses("text-sm text-gray-500", className)} {...props}>
      {children}
    </p>
  )
}

const DialogFooter = ({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={combineClasses("mt-4 flex justify-end space-x-2", className)}
      {...props}
    >
      {children}
    </div>
  )
}

const DialogClose = ({
  children,
  className,
  onClick,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  return (
    <button
      className={combineClasses(
        "absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100",
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children || (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      )}
    </button>
  )
}

export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} 