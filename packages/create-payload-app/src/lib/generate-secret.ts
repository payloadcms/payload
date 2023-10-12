import { randomBytes } from 'crypto'

export async function generateSecret(): Promise<string> {
  return randomBytes(32).toString('hex').slice(0, 24)
}
