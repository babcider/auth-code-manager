'use client'

import { useEffect } from 'react'

export type NotificationType = 'success' | 'error' | 'info'

interface NotificationProps {
  type: NotificationType
  message: string
  onClose: () => void
  duration?: number
}

const bgColors: Record<NotificationType, string> = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  info: 'bg-blue-500'
}

export default function Notification({ type, message, onClose, duration = 3000 }: NotificationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  return (
    <div className={`fixed bottom-4 right-4 ${bgColors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50`}>
      <div className="flex items-center">
        <span>{message}</span>
        <button
          onClick={onClose}
          className="ml-4 text-white hover:text-gray-200 focus:outline-none"
        >
          ✕
        </button>
      </div>
    </div>
  )
} 