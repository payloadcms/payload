import { randomBytes } from 'crypto'

export function generateSecret(): string {
  return randomBytes(32).toString('hex').slice(0, 24)
}
