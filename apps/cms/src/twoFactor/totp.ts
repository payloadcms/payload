import crypto from 'node:crypto'

/**
 * Time-based one-time passwords (RFC 6238) as used by Google Authenticator, 1Password, Authy, …:
 * HMAC-SHA1, 6 digits, a new code every 30 seconds.
 */

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
const DIGITS = 6
const STEP_SECONDS = 30

const toBase32 = ({ bytes }: { bytes: Buffer }): string => {
  let bits = ''
  for (const byte of bytes) {
    bits += byte.toString(2).padStart(8, '0')
  }

  let result = ''
  for (let i = 0; i < bits.length; i += 5) {
    result += BASE32[parseInt(bits.slice(i, i + 5).padEnd(5, '0'), 2)]
  }

  return result
}

const fromBase32 = ({ value }: { value: string }): Buffer => {
  let bits = ''
  for (const char of value.replace(/=+$/, '').toUpperCase()) {
    const index = BASE32.indexOf(char)
    if (index === -1) {
      throw new Error('Invalid base32 secret')
    }
    bits += index.toString(2).padStart(5, '0')
  }

  const bytes: number[] = []
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2))
  }

  return Buffer.from(bytes)
}

/** A new random secret (160 bits, base32), as authenticator apps expect */
export const generateSecret = (): string => toBase32({ bytes: crypto.randomBytes(20) })

/** The code for one 30-second time step */
export const generateCode = ({ secret, step }: { secret: string; step: number }): string => {
  const counter = Buffer.alloc(8)
  counter.writeBigUInt64BE(BigInt(step))

  const hmac = crypto
    .createHmac('sha1', fromBase32({ value: secret }))
    .update(counter)
    .digest()
  const offset = hmac[hmac.length - 1]! & 0xf
  const number = hmac.readUInt32BE(offset) & 0x7fffffff

  return String(number % 10 ** DIGITS).padStart(DIGITS, '0')
}

export const currentStep = (): number => Math.floor(Date.now() / 1000 / STEP_SECONDS)

/**
 * Returns the time step a code belongs to, or null. Accepts the previous and next step too, so a
 * phone clock that is slightly off still works.
 */
export const verifyCode = ({ code, secret }: { code: string; secret: string }): null | number => {
  const normalized = code.replace(/\s/g, '')
  if (!/^\d{6}$/.test(normalized)) {
    return null
  }

  const now = currentStep()
  for (const step of [now - 1, now, now + 1]) {
    const expected = generateCode({ secret, step })
    if (crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(normalized))) {
      return step
    }
  }

  return null
}

/** The link an authenticator app reads from the QR code */
export const otpauthURL = ({
  account,
  issuer,
  secret,
}: {
  account: string
  issuer: string
  secret: string
}): string => {
  const label = encodeURIComponent(`${issuer}:${account}`)
  const params = new URLSearchParams({
    algorithm: 'SHA1',
    digits: String(DIGITS),
    issuer,
    period: String(STEP_SECONDS),
    secret,
  })

  return `otpauth://totp/${label}?${params}`
}
