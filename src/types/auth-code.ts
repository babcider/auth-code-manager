export interface CodeGenerationOptions {
  count: number
  length: number
  prefix: string
  suffix: string
  expiryDate: Date | null
  useUppercase: boolean
  useLowercase: boolean
  useNumbers: boolean
  context?: string
}

export interface AuthCode {
  id: string
  code: string
  used: boolean
  used_at: string | null
  created_at: string
  expires_at: string
  context: string | null
}

export const DEFAULT_GENERATION_OPTIONS: CodeGenerationOptions = {
  count: 1,
  length: 8,
  prefix: '',
  suffix: '',
  expiryDate: new Date(new Date().setDate(new Date().getDate() + 7)),
  useUppercase: true,
  useLowercase: true,
  useNumbers: true,
  context: '',
} 