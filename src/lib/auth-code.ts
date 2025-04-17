import { CodeGenerationOptions } from '@/types/auth-code'

interface CodeOptions {
  length?: number;
  prefix?: string;
  suffix?: string;
  useUppercase?: boolean;
  useLowercase?: boolean;
  useNumbers?: boolean;
  count?: number;
}

export function generateCode(options: CodeOptions): string {
  const charset = []
  if (options.useUppercase) charset.push('ABCDEFGHIJKLMNOPQRSTUVWXYZ')
  if (options.useLowercase) charset.push('abcdefghijklmnopqrstuvwxyz')
  if (options.useNumbers) charset.push('0123456789')

  if (charset.length === 0) {
    throw new Error('At least one character set must be selected')
  }

  const allChars = charset.join('')
  let code = ''
  const length = options.length || 8

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * allChars.length)
    code += allChars[randomIndex]
  }

  const prefix = options.prefix || ''
  const suffix = options.suffix || ''
  return `${prefix}${code}${suffix}`
}

export function calculateExpiryDate(hours: number): string {
  const date = new Date()
  date.setHours(date.getHours() + hours)
  return date.toISOString()
}

function generateRandomString(length: number, charset: string): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}

export function generateAuthCodes(options: CodeOptions): string[] {
  const {
    count = 1,
    length = 8,
    prefix = '',
    suffix = '',
    useUppercase = true,
    useLowercase = true,
    useNumbers = true
  } = options;

  let charset = '';
  if (useUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (useLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
  if (useNumbers) charset += '0123456789';

  if (charset === '') {
    charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  }

  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const randomCode = generateRandomString(length, charset);
    codes.push(`${prefix}${randomCode}${suffix}`);
  }

  return codes;
} 