import crypto from 'crypto'

/**
 * A one-way, deterministic fingerprint of an API key. Unlike the `apiKeyIndex` HMAC it
 * replaces, this never depends on `payload.secret` or the encryption keyring - so rotating
 * or fully retiring `PAYLOAD_SECRET` has no effect on existing keys, the same property
 * passwords already have.
 *
 * A per-record salt (as used for passwords) is deliberately not used: salting defends
 * against precomputed dictionary/rainbow-table attacks on low-entropy, human-chosen
 * secrets, which does not apply to a 256-bit value from `generateAPIKey` - and salting
 * would make the hash non-deterministic, breaking the single-query lookup API key
 * authentication depends on (unlike a login, no separate identifier is sent alongside the
 * key to look the row up by first).
 */
export const hashAPIKey = (rawAPIKey: string): string =>
  crypto.createHash('sha256').update(rawAPIKey).digest('hex')

/**
 * A server-generated API key: 256 bits of randomness, url-safe so it can be used in a
 * header or query string without escaping.
 */
export const generateAPIKey = (): string => crypto.randomBytes(32).toString('base64url')
