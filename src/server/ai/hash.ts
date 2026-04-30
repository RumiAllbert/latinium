import { createHash } from 'node:crypto';

export function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalize).join(',')}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys
    .map((k) => `${JSON.stringify(k)}:${canonicalize(obj[k])}`)
    .join(',')}}`;
}

export function hashRequest(endpoint: string, body: unknown): string {
  return createHash('sha256')
    .update(`${endpoint}\n${canonicalize(body)}`)
    .digest('hex');
}

export function hashIp(ip: string): string {
  const secret = process.env.APP_SECRET;
  if (!secret) {
    throw new Error('APP_SECRET is not set');
  }
  return createHash('sha256').update(`${ip}\n${secret}`).digest('hex');
}
