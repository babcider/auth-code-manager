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

// 데이터베이스 제약조건에 맞는 문자 집합
const VALID_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateCode(options: CodeOptions): string {
  const length = options.length || 8
  let code = ''

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * VALID_CHARS.length)
    code += VALID_CHARS[randomIndex]
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