import crypto from 'crypto'

/** Creates the deterministic HMAC used to look up an API key without storing it in plaintext. */
export const createKeyIndex = ({ key, secret }: { key: string; secret: string }): string =>
  crypto.createHmac('sha256', secret).update(key).digest('hex')
