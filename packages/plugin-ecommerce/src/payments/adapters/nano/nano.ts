/**
 * Dependency-free Nano (XNO) helpers used by the Nano payment adapter: the BLAKE2b digest
 * (RFC 7693) behind the address checksum, the address codec, raw amount math on bigint, the
 * xno-binding v1 option C commitment and the send block check.
 *
 * Nothing here holds a key or a seed and nothing here touches the network; `nodeClient.ts`
 * reads a block from the node the operator configures and hands it to `verifySendBlock`. No
 * Node-only module is imported, so the file is safe in any bundle.
 */

/** 1 XNO is 10^30 raw. Every amount is derived from this; none is written out by hand. */
export const RAW_DECIMALS = 30
export const RAW_PER_XNO = 10n ** BigInt(RAW_DECIMALS)

// ---------------------------------------------------------------------------------------------
// BLAKE2b (RFC 7693), unkeyed, any output length from 1 to 64 bytes.
// ---------------------------------------------------------------------------------------------

const MASK64 = (1n << 64n) - 1n

const IV = [
  0x6a09e667f3bcc908n,
  0xbb67ae8584caa73bn,
  0x3c6ef372fe94f82bn,
  0xa54ff53a5f1d36f1n,
  0x510e527fade682d1n,
  0x9b05688c2b3e6c1fn,
  0x1f83d9abfb41bd6bn,
  0x5be0cd19137e2179n,
]

const SIGMA = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  [14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3],
  [11, 8, 12, 0, 5, 2, 15, 13, 10, 14, 3, 6, 7, 1, 9, 4],
  [7, 9, 3, 1, 13, 12, 11, 14, 2, 6, 5, 10, 4, 0, 15, 8],
  [9, 0, 5, 7, 2, 4, 10, 15, 14, 1, 11, 12, 6, 8, 3, 13],
  [2, 12, 6, 10, 0, 11, 8, 3, 4, 13, 7, 5, 15, 14, 1, 9],
  [12, 5, 1, 15, 14, 13, 4, 10, 0, 7, 6, 3, 9, 2, 8, 11],
  [13, 11, 7, 14, 12, 1, 3, 9, 5, 0, 15, 4, 8, 6, 2, 10],
  [6, 15, 14, 9, 11, 3, 0, 8, 12, 2, 13, 7, 1, 4, 10, 5],
  [10, 2, 8, 4, 7, 6, 1, 5, 15, 11, 9, 14, 3, 12, 13, 0],
]

const rotr64 = (x: bigint, n: bigint): bigint => ((x >> n) | (x << (64n - n))) & MASK64

const compress = (h: bigint[], block: Uint8Array, counter: bigint, last: boolean): void => {
  const m: bigint[] = []
  for (let i = 0; i < 16; i++) {
    let word = 0n
    for (let b = 7; b >= 0; b--) {
      word = (word << 8n) | BigInt(block[i * 8 + b]!)
    }
    m.push(word)
  }

  const v = [...h, ...IV]
  v[12] = v[12]! ^ (counter & MASK64)
  v[13] = v[13]! ^ (counter >> 64n)
  if (last) {
    v[14] = v[14]! ^ MASK64
  }

  const g = (a: number, b: number, c: number, d: number, x: bigint, y: bigint) => {
    v[a] = (v[a]! + v[b]! + x) & MASK64
    v[d] = rotr64(v[d]! ^ v[a]!, 32n)
    v[c] = (v[c]! + v[d]!) & MASK64
    v[b] = rotr64(v[b]! ^ v[c]!, 24n)
    v[a] = (v[a]! + v[b]! + y) & MASK64
    v[d] = rotr64(v[d]! ^ v[a]!, 16n)
    v[c] = (v[c]! + v[d]!) & MASK64
    v[b] = rotr64(v[b]! ^ v[c]!, 63n)
  }

  for (let round = 0; round < 12; round++) {
    const s = SIGMA[round % 10]!
    g(0, 4, 8, 12, m[s[0]!]!, m[s[1]!]!)
    g(1, 5, 9, 13, m[s[2]!]!, m[s[3]!]!)
    g(2, 6, 10, 14, m[s[4]!]!, m[s[5]!]!)
    g(3, 7, 11, 15, m[s[6]!]!, m[s[7]!]!)
    g(0, 5, 10, 15, m[s[8]!]!, m[s[9]!]!)
    g(1, 6, 11, 12, m[s[10]!]!, m[s[11]!]!)
    g(2, 7, 8, 13, m[s[12]!]!, m[s[13]!]!)
    g(3, 4, 9, 14, m[s[14]!]!, m[s[15]!]!)
  }

  for (let i = 0; i < 8; i++) {
    h[i] = h[i]! ^ v[i]! ^ v[i + 8]!
  }
}

export const blake2b = (input: Uint8Array, outLength: number): Uint8Array => {
  if (!Number.isInteger(outLength) || outLength < 1 || outLength > 64) {
    throw new Error('BLAKE2b output length must be between 1 and 64 bytes')
  }

  const h = [...IV]
  h[0] = h[0]! ^ (0x01010000n | BigInt(outLength))

  let counter = 0n
  let offset = 0
  while (input.length - offset > 128) {
    counter += 128n
    compress(h, input.subarray(offset, offset + 128), counter, false)
    offset += 128
  }

  const lastBlock = new Uint8Array(128)
  lastBlock.set(input.subarray(offset))
  counter += BigInt(input.length - offset)
  compress(h, lastBlock, counter, true)

  const out = new Uint8Array(outLength)
  for (let i = 0; i < outLength; i++) {
    out[i] = Number((h[i >> 3]! >> BigInt(8 * (i & 7))) & 0xffn)
  }
  return out
}

// ---------------------------------------------------------------------------------------------
// SHA-256 (FIPS 180-4), synchronous, for the binding commitment.
// ---------------------------------------------------------------------------------------------

const K256 = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]

export const sha256Hex = (text: string): string => {
  const data = new TextEncoder().encode(text)
  const bitLength = data.length * 8
  const padded = new Uint8Array((((data.length + 9 + 63) >> 6) << 6))
  padded.set(data)
  padded[data.length] = 0x80
  const view = new DataView(padded.buffer)
  view.setUint32(padded.length - 8, Math.floor(bitLength / 2 ** 32))
  view.setUint32(padded.length - 4, bitLength >>> 0)

  const h = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ]
  const w = new Uint32Array(64)
  const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n))

  for (let offset = 0; offset < padded.length; offset += 64) {
    for (let i = 0; i < 16; i++) {
      w[i] = view.getUint32(offset + i * 4)
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15]!, 7) ^ rotr(w[i - 15]!, 18) ^ (w[i - 15]! >>> 3)
      const s1 = rotr(w[i - 2]!, 17) ^ rotr(w[i - 2]!, 19) ^ (w[i - 2]! >>> 10)
      w[i] = (w[i - 16]! + s0 + w[i - 7]! + s1) >>> 0
    }
    let [a, b, c, d, e, f, g, hh] = h as [
      number,
      number,
      number,
      number,
      number,
      number,
      number,
      number,
    ]
    for (let i = 0; i < 64; i++) {
      const sigma1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)
      const t1 = (hh + sigma1 + ((e & f) ^ (~e & g)) + K256[i]! + w[i]!) >>> 0
      const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0
      hh = g
      g = f
      f = e
      e = (d + t1) >>> 0
      d = c
      c = b
      b = a
      a = (t1 + t2) >>> 0
    }
    h[0] = (h[0]! + a) >>> 0
    h[1] = (h[1]! + b) >>> 0
    h[2] = (h[2]! + c) >>> 0
    h[3] = (h[3]! + d) >>> 0
    h[4] = (h[4]! + e) >>> 0
    h[5] = (h[5]! + f) >>> 0
    h[6] = (h[6]! + g) >>> 0
    h[7] = (h[7]! + hh) >>> 0
  }

  return h.map((x) => x.toString(16).padStart(8, '0')).join('')
}

// ---------------------------------------------------------------------------------------------
// Addresses: `nano_` + 52 base32 characters of the public key + 8 of a BLAKE2b-40 checksum.
// ---------------------------------------------------------------------------------------------

const ALPHABET = '13456789abcdefghijkmnopqrstuwxyz'

const hexToBytes = (hex: string): Uint8Array => {
  if (!/^[0-9a-fA-F]*$/.test(hex) || hex.length % 2 !== 0) {
    throw new Error('Invalid hex string')
  }
  const out = new Uint8Array(hex.length / 2)
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return out
}

const bytesToHex = (bytes: Uint8Array): string =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('').toUpperCase()

const encodeBase32 = (bytes: Uint8Array, bitLength: number): string => {
  let value = 0n
  for (const byte of bytes) {
    value = (value << 8n) | BigInt(byte)
  }
  let out = ''
  for (let i = bitLength / 5 - 1; i >= 0; i--) {
    out += ALPHABET[Number((value >> BigInt(i * 5)) & 31n)]
  }
  return out
}

const decodeBase32 = (text: string): bigint => {
  let value = 0n
  for (const char of text) {
    const index = ALPHABET.indexOf(char)
    if (index < 0) {
      throw new Error('Nano address contains an invalid character')
    }
    value = (value << 5n) | BigInt(index)
  }
  return value
}

const ADDRESS_PATTERN =
  /^(?:nano|xrb)_([13][13456789abcdefghijkmnopqrstuwxyz]{51})([13456789abcdefghijkmnopqrstuwxyz]{8})$/

const checksumOf = (publicKey: Uint8Array): Uint8Array => blake2b(publicKey, 5).reverse()

export const accountFromPublicKey = (publicKeyHex: string): string => {
  const key = hexToBytes(publicKeyHex)
  if (key.length !== 32) {
    throw new Error('A Nano public key is 32 bytes')
  }
  return `nano_${encodeBase32(key, 260)}${encodeBase32(checksumOf(key), 40)}`
}

/** Returns the upper-case hex public key, or throws if the address or its checksum is invalid. */
export const publicKeyFromAccount = (account: string): string => {
  const match = ADDRESS_PATTERN.exec(typeof account === 'string' ? account.trim() : '')
  if (!match) {
    throw new Error('Not a Nano address')
  }
  const keyValue = decodeBase32(match[1]!)
  const key = new Uint8Array(32)
  for (let i = 0; i < 32; i++) {
    key[i] = Number((keyValue >> BigInt(8 * (31 - i))) & 0xffn)
  }
  if (encodeBase32(checksumOf(key), 40) !== match[2]) {
    throw new Error('Nano address checksum does not match')
  }
  return bytesToHex(key)
}

export const isValidAccount = (account: string): boolean => {
  try {
    publicKeyFromAccount(account)
    return true
  } catch {
    return false
  }
}

/** The canonical `nano_` spelling of an address, so `xrb_` and `nano_` forms compare equal. */
export const normalizeAccount = (account: string): string =>
  accountFromPublicKey(publicKeyFromAccount(account))

// ---------------------------------------------------------------------------------------------
// Amounts, as raw integers in bigint. No floating point anywhere.
// ---------------------------------------------------------------------------------------------

export const xnoToRaw = (xno: string): bigint => {
  const match = /^(\d+)(?:\.(\d+))?$/.exec(typeof xno === 'string' ? xno.trim() : '')
  if (!match || (match[2] && match[2].length > RAW_DECIMALS)) {
    throw new Error('XNO amount must be a plain decimal with at most 30 decimals')
  }
  const fraction = (match[2] || '').padEnd(RAW_DECIMALS, '0')
  return BigInt(match[1]!) * RAW_PER_XNO + BigInt(fraction)
}

export const rawToXno = (raw: bigint): string => {
  if (raw < 0n) {
    throw new Error('Raw amount cannot be negative')
  }
  const whole = raw / RAW_PER_XNO
  const fraction = (raw % RAW_PER_XNO).toString().padStart(RAW_DECIMALS, '0').replace(/0+$/, '')
  return fraction ? `${whole}.${fraction}` : whole.toString()
}

export const parseRaw = (raw: unknown): bigint => {
  if (typeof raw !== 'string' || !/^\d{1,40}$/.test(raw)) {
    throw new Error('Raw amount must be a decimal integer string')
  }
  return BigInt(raw)
}

/**
 * The exact raw price of a transaction amount. `amount` is in the unit Payload stores (the
 * currency's smallest unit, e.g. cents) and `xnoPerUnit` is the operator's price of ONE such unit.
 */
export const quoteRaw = ({
  amount,
  xnoPerUnit,
}: {
  amount: number
  xnoPerUnit: string
}): bigint => {
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new Error('Amount must be a positive integer in the currency smallest unit')
  }
  const raw = BigInt(amount) * xnoToRaw(xnoPerUnit)
  if (raw <= 0n) {
    throw new Error('The Nano price for this currency must be above zero')
  }
  return raw
}

// ---------------------------------------------------------------------------------------------
// Binding: xno-binding v1 option C. A Nano send has no memo, so the payer sets the send block's
// representative to an account derived from the order reference, the receiving account and the
// exact raw amount. A block can then settle one order at one price only.
// ---------------------------------------------------------------------------------------------

const BINDING_DOMAIN = 'xno-binding/v1/rep|'

export const bindingCommitmentHex = ({
  payTo,
  priceRaw,
  reference,
}: {
  payTo: string
  priceRaw: bigint
  reference: string
}): string =>
  sha256Hex(`${BINDING_DOMAIN}${reference}|${payTo}|${priceRaw.toString()}`)

export const bindingRepresentative = (args: {
  payTo: string
  priceRaw: bigint
  reference: string
}): string => accountFromPublicKey(bindingCommitmentHex(args))

// ---------------------------------------------------------------------------------------------
// The send block check. `block` is the node's `block_info` answer with `json_block: true`.
// ---------------------------------------------------------------------------------------------

export type NanoBlockInfo = {
  amount?: unknown
  confirmed?: unknown
  contents?: {
    link_as_account?: unknown
    representative?: unknown
    type?: unknown
  }
  local_timestamp?: unknown
  subtype?: unknown
}

export const verifySendBlock = ({
  block,
  maxAgeSeconds,
  now,
  payTo,
  priceRaw,
  reference,
}: {
  block: NanoBlockInfo
  maxAgeSeconds: number
  now: number
  payTo: string
  priceRaw: bigint
  reference: string
}): void => {
  if (!block || typeof block !== 'object') {
    throw new Error('Nano block not found')
  }
  if (block.confirmed !== 'true' && block.confirmed !== true) {
    throw new Error('Nano block is not confirmed yet')
  }
  if (block.subtype !== 'send' || block.contents?.type !== 'state') {
    throw new Error('Nano block is not a send')
  }

  const destination = block.contents?.link_as_account
  if (typeof destination !== 'string' || !isValidAccount(destination)) {
    throw new Error('Nano block has no valid destination')
  }
  if (normalizeAccount(destination) !== normalizeAccount(payTo)) {
    throw new Error('Nano block was sent to another account')
  }

  if (parseRaw(block.amount) !== priceRaw) {
    throw new Error('Nano block amount does not match the order amount')
  }

  const representative = block.contents?.representative
  const expected = bindingRepresentative({ payTo: normalizeAccount(payTo), priceRaw, reference })
  if (
    typeof representative !== 'string' ||
    !isValidAccount(representative) ||
    normalizeAccount(representative) !== expected
  ) {
    throw new Error('Nano block is bound to another order')
  }

  const timestamp = Number(block.local_timestamp)
  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    throw new Error('Nano block has no timestamp')
  }
  if (now - timestamp > maxAgeSeconds || timestamp - now > 300) {
    throw new Error('Nano block is outside the accepted time window')
  }
}

export const isBlockHash = (value: unknown): value is string =>
  typeof value === 'string' && /^[0-9A-Fa-f]{64}$/.test(value)
