type RecordValue = Record<string, unknown>

type SettlementPaymentIntent = {
  amount?: unknown
  currency?: unknown
  customer?: unknown
  id?: unknown
  metadata?: unknown
  status?: unknown
}

type SettlementTransaction = {
  amount?: unknown
  cart?: unknown
  currency?: unknown
  customer?: unknown
  customerEmail?: unknown
  id?: unknown
  items?: unknown
  order?: unknown
  status?: unknown
  stripe?: unknown
}

type SettlementValidationArgs = {
  canonicalCartID: unknown
  /**
   * SHA-256 hex digest of the normalised cart items recorded at initiatePayment time.
   * When absent (PaymentIntents created before this field was introduced) the hash
   * comparison is skipped so upgrades remain safe.
   */
  cartItemsHash: string | undefined
  customerEmail: unknown
  paymentIntent: SettlementPaymentIntent
  paymentIntentID: string
  transaction: SettlementTransaction
  user?: { id?: unknown } | null
}

export const getRelationshipID = (value: unknown): string | undefined => {
  const relationshipID = isRecord(value) ? value.id : value

  if (typeof relationshipID === 'number' && Number.isFinite(relationshipID)) {
    return String(relationshipID)
  }

  if (typeof relationshipID === 'string' && relationshipID.trim()) {
    return relationshipID
  }

  return undefined
}

export const normalizeEmail = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined
  }

  const normalizedEmail = value.trim().toLowerCase()

  return normalizedEmail || undefined
}

export const normalizeCartItems = (items: unknown): unknown[] => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Cart items are missing or invalid')
  }

  return items.map((item) => {
    if (!isRecord(item)) {
      throw new Error('Cart items are missing or invalid')
    }

    const productID = getRelationshipID(item.product)

    if (!productID || typeof item.quantity !== 'number' || !Number.isFinite(item.quantity)) {
      throw new Error('Cart items are missing or invalid')
    }

    return Object.fromEntries(
      Object.entries(item).flatMap(([key, value]) => {
        if (key === 'product') {
          return [[key, productID]]
        }

        if (key === 'variant') {
          if (value === null || value === undefined) {
            return []
          }

          const variantID = getRelationshipID(value)

          if (!variantID) {
            throw new Error('Cart item variant relationship is invalid')
          }

          return [[key, variantID]]
        }

        const normalizedValue = normalizeValue(value)

        return normalizedValue === undefined ? [] : [[key, normalizedValue]]
      }),
    )
  })
}

export const validateSettlement = ({
  canonicalCartID,
  cartItemsHash,
  customerEmail,
  paymentIntent,
  paymentIntentID,
  transaction,
  user,
}: SettlementValidationArgs): void => {
  if (
    paymentIntentID !== getNestedString(transaction, 'stripe', 'paymentIntentID') ||
    paymentIntentID !== paymentIntent.id
  ) {
    throw new Error('PaymentIntent does not match the transaction')
  }

  const normalizedCartID = getRelationshipID(canonicalCartID)

  if (!normalizedCartID || normalizedCartID !== getRelationshipID(transaction.cart)) {
    throw new Error('Canonical cart does not match the transaction cart')
  }

  const metadata = isRecord(paymentIntent.metadata) ? paymentIntent.metadata : undefined

  if (normalizedCartID !== getRelationshipID(metadata?.cartID)) {
    throw new Error('Canonical cart does not match the PaymentIntent cart')
  }

  const transactionCustomerID = getRelationshipID(transaction.customer)

  if (user !== null && user !== undefined) {
    const authenticatedUserID = getRelationshipID(user.id)

    if (!authenticatedUserID) {
      throw new Error('Authenticated customer ID is missing or invalid')
    }

    if (transactionCustomerID !== authenticatedUserID) {
      throw new Error('Authenticated customer does not match the transaction customer')
    }
  } else {
    if (transactionCustomerID) {
      throw new Error('Guest transaction belongs to an authenticated customer')
    }

    const normalizedCustomerEmail = normalizeEmail(customerEmail)

    if (
      !normalizedCustomerEmail ||
      normalizedCustomerEmail !== normalizeEmail(transaction.customerEmail)
    ) {
      throw new Error('Guest email does not match the transaction email')
    }
  }

  const stripeCustomerID = getNestedString(transaction, 'stripe', 'customerID')

  if (!stripeCustomerID || stripeCustomerID !== getRelationshipID(paymentIntent.customer)) {
    throw new Error('Stripe customer does not match the transaction')
  }

  if (paymentIntent.amount !== transaction.amount) {
    throw new Error('Stripe amount does not match the transaction amount')
  }

  if (
    typeof paymentIntent.currency !== 'string' ||
    typeof transaction.currency !== 'string' ||
    paymentIntent.currency.toUpperCase() !== transaction.currency
  ) {
    throw new Error('Stripe currency does not match the transaction currency')
  }

  // cartItemsHash is present on PaymentIntents created after the hash-based approach
  // was introduced. PaymentIntents without it (from the previous version) skip the
  // comparison so that upgrades remain safe.
  if (cartItemsHash !== undefined) {
    const transactionItemsHash = hashCartItems(transaction.items)

    if (cartItemsHash !== transactionItemsHash) {
      throw new Error('Stripe cart items do not match the transaction items')
    }
  }

  if (paymentIntent.status !== 'succeeded') {
    throw new Error('Payment not completed.')
  }
}

/**
 * Compute a SHA-256 hex digest of the stable-serialised, normalised cart items.
 * The result is 64 hex characters, well within Stripe's 500-character metadata limit.
 */
export const hashCartItems = (items: unknown): string => {
  const normalizedItems = normalizeCartItems(items)
  const serialized = stableSerialize(normalizedItems)
  return sha256Hex(serialized)
}

/**
 * Pure synchronous SHA-256 implementation (no native crypto dependency) so this
 * module stays usable in every Payload runtime (Node, Edge, Cloudflare Workers).
 */
const sha256Hex = (message: string): string => {
  // Encode to UTF-8 bytes
  const msgBytes = encodeUtf8(message)
  // SHA-256 constants
  const K: number[] = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4,
    0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe,
    0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f,
    0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
    0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc,
    0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
    0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116,
    0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7,
    0xc67178f2,
  ]

  // Initial hash values
  let h0 = 0x6a09e667
  let h1 = 0xbb67ae85
  let h2 = 0x3c6ef372
  let h3 = 0xa54ff53a
  let h4 = 0x510e527f
  let h5 = 0x9b05688c
  let h6 = 0x1f83d9ab
  let h7 = 0x5be0cd19

  // Pre-processing: padding
  const msgLen = msgBytes.length
  const bitLen = msgLen * 8
  const padded: number[] = [...msgBytes, 0x80]

  while (padded.length % 64 !== 56) {
    padded.push(0)
  }

  // Append bit length as 64-bit big-endian (JS numbers are safe up to 2^53)
  padded.push(0, 0, 0, 0)
  padded.push((bitLen / 0x1000000) & 0xff)
  padded.push((bitLen / 0x10000) & 0xff)
  padded.push((bitLen / 0x100) & 0xff)
  padded.push(bitLen & 0xff)

  // Process each 512-bit chunk
  for (let i = 0; i < padded.length; i += 64) {
    const w: number[] = []

    for (let j = 0; j < 16; j++) {
      w[j] =
        ((padded[i + j * 4]! << 24) |
          (padded[i + j * 4 + 1]! << 16) |
          (padded[i + j * 4 + 2]! << 8) |
          padded[i + j * 4 + 3]!) >>>
        0
    }

    for (let j = 16; j < 64; j++) {
      const s0 = rotr(w[j - 15]!, 7) ^ rotr(w[j - 15]!, 18) ^ (w[j - 15]! >>> 3)
      const s1 = rotr(w[j - 2]!, 17) ^ rotr(w[j - 2]!, 19) ^ (w[j - 2]! >>> 10)
      w[j] = (w[j - 16]! + s0 + w[j - 7]! + s1) >>> 0
    }

    let a = h0,
      b = h1,
      c = h2,
      d = h3,
      e = h4,
      f = h5,
      g = h6,
      h = h7

    for (let j = 0; j < 64; j++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)
      const ch = (e & f) ^ (~e & g)
      const temp1 = (h + S1 + ch + K[j]! + w[j]!) >>> 0
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)
      const maj = (a & b) ^ (a & c) ^ (b & c)
      const temp2 = (S0 + maj) >>> 0
      h = g
      g = f
      f = e
      e = (d + temp1) >>> 0
      d = c
      c = b
      b = a
      a = (temp1 + temp2) >>> 0
    }

    h0 = (h0 + a) >>> 0
    h1 = (h1 + b) >>> 0
    h2 = (h2 + c) >>> 0
    h3 = (h3 + d) >>> 0
    h4 = (h4 + e) >>> 0
    h5 = (h5 + f) >>> 0
    h6 = (h6 + g) >>> 0
    h7 = (h7 + h) >>> 0
  }

  return [h0, h1, h2, h3, h4, h5, h6, h7].map((n) => n.toString(16).padStart(8, '0')).join('')
}

const rotr = (n: number, bits: number): number => ((n >>> bits) | (n << (32 - bits))) >>> 0

const encodeUtf8 = (str: string): number[] => {
  const bytes: number[] = []

  for (let i = 0; i < str.length; i++) {
    let code = str.charCodeAt(i)

    if (code < 0x80) {
      bytes.push(code)
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f))
    } else if (code >= 0xd800 && code <= 0xdbff) {
      const next = str.charCodeAt(++i)
      code = 0x10000 + ((code - 0xd800) << 10) + (next - 0xdc00)
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f),
      )
    } else {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f))
    }
  }

  return bytes
}

const getNestedString = (
  value: unknown,
  groupName: string,
  fieldName: string,
): string | undefined => {
  if (!isRecord(value)) {
    return undefined
  }

  const group = value[groupName]

  if (!isRecord(group) || typeof group[fieldName] !== 'string') {
    return undefined
  }

  return group[fieldName]
}

const isRecord = (value: unknown): value is RecordValue =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const normalizeValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeValue(entry))
  }

  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).flatMap(([entryKey, entryValue]) => {
        const normalizedValue = normalizeValue(entryValue)

        return normalizedValue === undefined ? [] : [[entryKey, normalizedValue]]
      }),
    )
  }

  if (
    value === null ||
    typeof value === 'boolean' ||
    typeof value === 'number' ||
    typeof value === 'string'
  ) {
    return value
  }

  if (value === undefined) {
    return undefined
  }

  throw new Error('Cart items contain unsupported data')
}

const stableSerialize = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableSerialize(entry)).join(',')}]`
  }

  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`)
      .join(',')}}`
  }

  return JSON.stringify(value)
}
