import crypto from 'crypto'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({
  path: path.resolve(__dirname, '../../../.env'),
})

const createKeyFromSecret = (secretKey: string): string =>
  crypto.createHash('sha256').update(secretKey).digest('hex').slice(0, 32)

const algorithm = 'aes-256-ctr'

export const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(
    algorithm,
    createKeyFromSecret(process.env.PAYLOAD_SECRET),
    iv,
  )

  const encrypted = Buffer.concat([cipher.update(text), cipher.final()])

  const ivString = iv.toString('hex')
  const encryptedString = encrypted.toString('hex')

  const result = `${ivString}${encryptedString}`
  return result
}

export const decrypt = (hash: string): string => {
  const iv = hash.slice(0, 32)
  const content = hash.slice(32)

  const decipher = crypto.createDecipheriv(
    algorithm,
    createKeyFromSecret(process.env.PAYLOAD_SECRET),
    Buffer.from(iv, 'hex'),
  )

  const decrypted = Buffer.concat([decipher.update(Buffer.from(content, 'hex')), decipher.final()])

  const result = decrypted.toString()
  return result
}
