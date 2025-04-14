import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function combineClasses(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })
}

export function formatExpiry(date: Date | string | null) {
  if (!date) return "만료 기한 없음"
  const expiryDate = new Date(date)
  if (expiryDate < new Date()) return "만료됨"
  return formatDate(date)
}

export function isExpired(date: Date | string | null) {
  if (!date) return false
  return new Date(date) < new Date()
}

export function calculateExpiryDate(hours: number): Date {
  const date = new Date()
  date.setHours(date.getHours() + hours)
  return date
}

export function downloadJson(data: any, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function readJsonFile(file: File): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string)
        resolve(json)
      } catch (error) {
        reject(new Error('Invalid JSON file'))
      }
    }
    reader.onerror = () => reject(new Error('Error reading file'))
    reader.readAsText(file)
  })
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
} 