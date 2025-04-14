'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import Notification from '@/components/Notification'

type NotificationType = 'success' | 'error' | 'info'

interface NotificationContextType {
  showNotification: (type: NotificationType, message: string) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notification, setNotification] = useState<{
    type: NotificationType
    message: string
  } | null>(null)

  const showNotification = (type: NotificationType, message: string) => {
    setNotification({ type, message })
  }

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
} 