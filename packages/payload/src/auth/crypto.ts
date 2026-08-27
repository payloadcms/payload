import crypto from 'crypto'

/**
 * A single secret in the keyring, with its derived keys precomputed.
 */
export type EncryptionKey = {
  /** One-way fingerprint of `v1Key` (16 hex chars), stored in the v1 envelope. */
  keyId: string
  /** Legacy 32-char key for aes-256-ctr and the apiKey HMAC index. */
  legacyKey: string
  /** The raw `PAYLOAD_SECRET` string. */
  secret: string
  /** True 32-byte key (HKDF) for the aes-256-gcm v1 envelope. */
  v1Key: Buffer
}

/**
 * The set of secrets Payload accepts. `active` is used for all writes; every
 * entry (active + `previousSecrets`) is accepted for reads.
 */
export type EncryptionKeyring = {
  /** Entry used for all new writes (the current `PAYLOAD_SECRET`). */
  active: EncryptionKey
  all: EncryptionKey[]
  /** keyId -> entry, for O(1) v1 key selection. */
  byId: Record<string, EncryptionKey>
}

type CryptoContext = {
  encryptionKeyring: EncryptionKeyring
  secret: string
}

const legacyAlgorithm = 'aes-256-ctr'
const v1Algorithm = 'aes-256-gcm'
const v1Prefix = 'v1'

/**
 * Legacy key derivation (pre-v1 aes-256-ctr values and the apiKey HMAC index).
 * Kept in sync with `BasePayload.secret`.
 */
export const deriveSecretKey = (secret: string): string =>
  crypto.createHash('sha256').update(secret).digest('hex').slice(0, 32)

/**
 * v1 key derivation: a true 32-byte key via HKDF, correcting the reduced
 * effective entropy of the legacy derivation.
 */
export const deriveKeyV1 = (secret: string): Buffer =>
  Buffer.from(crypto.hkdfSync('sha256', secret, '', 'payload-secret-v1', 32))

/** Non-secret fingerprint of a v1 key, used to select the key on decrypt. */
export const keyIdFor = (v1Key: Buffer): string =>
  crypto.createHash('sha256').update(v1Key).digest('hex').slice(0, 16)

/**
 * The API key lookup index: an HMAC-SHA256 of the raw key under a derived secret
 * (see {@link deriveSecretKey}). Kept as one shared implementation since it is
 * computed on write (`apiKey` field hook), on lookup (the api-key auth strategy,
 * under every keyring secret), and during `rotateSecret`/migration re-keying -
 * all of these must agree on the exact same bytes.
 */
export const computeAPIKeyIndex = (derivedKey: string, rawApiKey: string): string =>
  crypto.createHmac('sha256', derivedKey).update(rawApiKey).digest('hex')

export const buildEncryptionKey = (secret: string): EncryptionKey => {
  const v1Key = deriveKeyV1(secret)
  return {
    keyId: keyIdFor(v1Key),
    legacyKey: deriveSecretKey(secret),
    secret,
    v1Key,
  }
}

/**
 * Builds the keyring from the active secret followed by any previous secrets.
 * The first entry is the active (writing) key.
 */
export const buildEncryptionKeyring = (secrets: string[]): EncryptionKeyring => {
  const all = secrets.map(buildEncryptionKey)
  const byId: Record<string, EncryptionKey> = {}
  for (const key of all) {
    // First writer wins if two secrets somehow share a keyId.
    if (!byId[key.keyId]) {
      byId[key.keyId] = key
    }
  }
  return { active: all[0]!, all, byId }
}

/**
 * Encrypts `text` under the active secret using the versioned aes-256-gcm
 * envelope `v1:<keyId>:<iv>:<authTag>:<ciphertext>`. Pass `options.secret` (the
 * raw `PAYLOAD_SECRET`) to encrypt under a specific secret instead.
 */
export function encrypt(this: CryptoContext, text: string, options?: { secret?: string }): string {
  const key = options?.secret ? buildEncryptionKey(options.secret) : this.encryptionKeyring.active

  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(v1Algorithm, key.v1Key, iv)

  const ciphertext = cipher.update(text, 'utf8', 'hex') + cipher.final('hex')
  const authTag = cipher.getAuthTag().toString('hex')

  return `${v1Prefix}:${key.keyId}:${iv.toString('hex')}:${authTag}:${ciphertext}`
}

/**
 * Decrypts a value produced by {@link encrypt}. Dispatches on format: v1
 * envelopes are authenticated (aes-256-gcm) and select their key by keyId from
 * the keyring; pre-v1 values fall back to aes-256-ctr. Pass `options.secret` to
 * decrypt under a specific secret (e.g. to read data encrypted under a previous
 * secret during a rotation).
 */
export function decrypt(this: CryptoContext, hash: string, options?: { secret?: string }): string {
  if (hash.startsWith(`${v1Prefix}:`)) {
    const parts = hash.split(':')

    if (parts.length !== 5) {
      throw new Error('decrypt: malformed v1 envelope, expected "v1:keyId:iv:authTag:ciphertext".')
    }

    const [, keyId, ivHex, authTagHex, ciphertext] = parts

    const key = options?.secret
      ? buildEncryptionKey(options.secret)
      : this.encryptionKeyring.byId[keyId!]

    if (!key) {
      throw new Error(
        `decrypt: no secret in the keyring matches key id "${keyId}". Add the secret that encrypted this value to config.previousSecrets.`,
      )
    }

    const decipher = crypto.createDecipheriv(v1Algorithm, key.v1Key, Buffer.from(ivHex!, 'hex'))
    decipher.setAuthTag(Buffer.from(authTagHex!, 'hex'))

    // final() throws on a wrong key or tampered ciphertext.
    return decipher.update(ciphertext!, 'hex', 'utf8') + decipher.final('utf8')
  }

  // Legacy aes-256-ctr is unauthenticated, so it cannot verify a key and a wrong
  // key returns garbage instead of throwing. We therefore intentionally use only
  // the explicit or active key here (never trial the keyring): a legacy value
  // written under a previous secret decrypts to garbage until rotateSecret
  // upgrades it to the authenticated v1 envelope. API key auth is unaffected
  // (it matches the HMAC apiKeyIndex, which is keyring-aware).
  const legacyKey = options?.secret ? deriveSecretKey(options.secret) : this.secret
  const iv = hash.slice(0, 32)
  const content = hash.slice(32)
  const decipher = crypto.createDecipheriv(legacyAlgorithm, legacyKey, Buffer.from(iv, 'hex'))

  return decipher.update(content, 'hex', 'utf8') + decipher.final('utf8')
}

/**
 * Re-encrypts a value that was encrypted under a previous secret: decrypts it
 * with `options.oldSecret`, then re-encrypts it with the active secret. Also
 * upgrades a legacy aes-256-ctr value to the v1 envelope.
 */
export function reencrypt(
  this: CryptoContext,
  hash: string,
  options: { oldSecret: string },
): string {
  const plaintext = decrypt.call(this, hash, { secret: options.oldSecret })
  return encrypt.call(this, plaintext)
}
