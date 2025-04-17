import { CodeGenerationOptions } from '@/types/auth-code'

export function generateCode(options: CodeGenerationOptions): string {
  const charset = []
  if (options.useUppercase) charset.push('ABCDEFGHIJKLMNOPQRSTUVWXYZ')
  if (options.useLowercase) charset.push('abcdefghijklmnopqrstuvwxyz')
  if (options.useNumbers) charset.push('0123456789')

  if (charset.length === 0) {
    throw new Error('At least one character set must be selected')
  }

  const allChars = charset.join('')
  let code = ''

  for (let i = 0; i < options.length; i++) {
    const randomIndex = Math.floor(Math.random() * allChars.length)
    code += allChars[randomIndex]
  }

  return `${options.prefix}${code}${options.suffix}`
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

export function generateAuthCodes(options: CodeGenerationOptions): string[] {
  const {
    count = 1,
    length = 8,
    prefix = '',
    suffix = '',
    uppercase = true,
    lowercase = true,
    numbers = true
  } = options;

  let charset = '';
  if (uppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (lowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
  if (numbers) charset += '0123456789';

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