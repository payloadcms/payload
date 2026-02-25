import crypto from 'crypto'

const algorithm = 'aes-256-ctr'

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16)
  // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
  const secret = this.secret
  const cipher = crypto.createCipheriv(algorithm, secret, iv)

  const encrypted = cipher.update(text, 'utf8', 'hex') + cipher.final('hex')
  const ivString = iv.toString('hex')

  return `${ivString}${encrypted}`
}

export function decrypt(hash: string): string {
  const iv = hash.slice(0, 32)
  const content = hash.slice(32)

  // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
  const secret = this.secret
  const decipher = crypto.createDecipheriv(algorithm, secret, Buffer.from(iv, 'hex'))

  return decipher.update(content, 'hex', 'utf8') + decipher.final('utf8')
}
