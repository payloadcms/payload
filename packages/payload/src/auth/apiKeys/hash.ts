import crypto from 'crypto'

/**
 * A one-way, deterministic fingerprint of a generated API key secret. Unlike
 * {@link import('../crypto.js').computeAPIKeyIndex}, this never depends on `payload.secret`
 * or the encryption keyring - so rotating or fully retiring `PAYLOAD_SECRET` has no effect
 * on existing keys, the same property user passwords already have.
 *
 * A per-record salt (as used for passwords) is deliberately not used: salting defends
 * against precomputed dictionary/rainbow-table attacks on low-entropy, human-chosen
 * secrets, which does not apply to a 256-bit value from `generateAPIKeySecret` - and
 * salting would make the hash non-deterministic, breaking the single-query lookup API key
 * authentication depends on (unlike a login, no separate identifier is sent alongside the
 * key to look the row up by first).
 */
export const hashAPIKeySecret = (rawApiKeySecret: string): string =>
  crypto.createHash('sha256').update(rawApiKeySecret).digest('hex')
