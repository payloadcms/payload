import crypto from 'crypto'

const algorithm = 'aes-256-ctr'

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16)
  // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
  const secret = this.secret
  const cipher = crypto.createCipheriv(algorithm, secret, iv)

  const encrypted = Buffer.concat([cipher.update(text), cipher.final()])

  const ivString = iv.toString('hex')
  const encryptedString = encrypted.toString('hex')

  return `${ivString}${encryptedString}`
}

export function decrypt(hash: string): string {
  const iv = hash.slice(0, 32)
  const content = hash.slice(32)

  // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
  const secret = this.secret
  const decipher = crypto.createDecipheriv(algorithm, secret, Buffer.from(iv, 'hex'))

  const decrypted = Buffer.concat([decipher.update(Buffer.from(content, 'hex')), decipher.final()])

  return decrypted.toString()
}
