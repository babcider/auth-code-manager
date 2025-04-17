import { v4 as uuidv4 } from 'uuid';

interface AuthCodeOptions {
  institutionName?: string;
  agency?: string;
  memo?: string;
  expirationTime?: number;
  useInstitutionName?: boolean;
  useAgency?: boolean;
}

export function generateAuthCode(options: AuthCodeOptions = {}): string {
  const {
    institutionName = '',
    agency = '',
    memo = '',
    expirationTime = 0,
    useInstitutionName = false,
    useAgency = false
  } = options;

  const key = generateRandomKey();
  const timestamp = Date.now();
  const uuid = uuidv4();

  let code = `${key}-${timestamp}`;

  if (useInstitutionName && institutionName) {
    code += `-${institutionName}`;
  }

  if (useAgency && agency) {
    code += `-${agency}`;
  }

  if (memo) {
    code += `-${memo}`;
  }

  if (expirationTime > 0) {
    code += `-${expirationTime}`;
  }

  code += `-${uuid}`;
  return code;
}

function generateRandomKey(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
} 