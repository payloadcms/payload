import crypto from 'crypto'

/** Generates a stable API key so it can be revealed before its document is saved. */
export const generateAPIKeyFromSeed = ({
  secret,
  seed,
}: {
  secret: string
  seed: string
}): string => {
  const bytes = crypto
    .createHmac('sha256', secret)
    .update(`payload:api-key:${seed}`)
    .digest()
    .subarray(0, 16)

  bytes[6] = (bytes[6]! & 0x0f) | 0x40
  bytes[8] = (bytes[8]! & 0x3f) | 0x80

  const hex = bytes.toString('hex')

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
