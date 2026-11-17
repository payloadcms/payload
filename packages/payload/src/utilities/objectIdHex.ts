/**
 * Isomorphic, dependency-free helpers for generating and validating
 * 24-character hex strings in MongoDB ObjectId layout.
 *
 * Layout: 4-byte timestamp + 5-byte per-process random + 3-byte counter.
 */

const HEX_TABLE: string[] = []
for (let i = 0; i < 256; i++) {
  HEX_TABLE.push((i < 16 ? '0' : '') + i.toString(16))
}

const HEX_24_REGEX = /^[0-9a-f]{24}$/i

type ObjectIdLike = {
  toHexString: () => string
}

const getRandomBytes = (length: number): Uint8Array => {
  const buf = new Uint8Array(length)
  globalThis.crypto.getRandomValues(buf)
  return buf
}

// Seeded lazily on the first generateObjectIdHex() call: runtimes like Cloudflare Workers
// reject crypto.getRandomValues() at module scope, and this module is loaded by every config.
let processRandom: Uint8Array | undefined
let counter = 0

const getProcessRandom = (): Uint8Array => {
  if (!processRandom) {
    processRandom = getRandomBytes(5)

    const initialCounterBytes = getRandomBytes(3)
    counter =
      ((initialCounterBytes[0]! << 16) | (initialCounterBytes[1]! << 8) | initialCounterBytes[2]!) &
      0xffffff
  }

  return processRandom
}

export const generateObjectIdHex = (): string => {
  const random = getProcessRandom()
  const time = Math.floor(Date.now() / 1000) & 0xffffffff
  // This matches the BSON ObjectId layout: the 3-byte counter rolls over after 16,777,216 IDs.
  counter = (counter + 1) & 0xffffff
  const inc = counter

  return (
    HEX_TABLE[(time >>> 24) & 0xff]! +
    HEX_TABLE[(time >>> 16) & 0xff]! +
    HEX_TABLE[(time >>> 8) & 0xff]! +
    HEX_TABLE[time & 0xff]! +
    HEX_TABLE[random[0]!]! +
    HEX_TABLE[random[1]!]! +
    HEX_TABLE[random[2]!]! +
    HEX_TABLE[random[3]!]! +
    HEX_TABLE[random[4]!]! +
    HEX_TABLE[(inc >>> 16) & 0xff]! +
    HEX_TABLE[(inc >>> 8) & 0xff]! +
    HEX_TABLE[inc & 0xff]!
  )
}

export const getObjectIdHex = (value: unknown): string | undefined => {
  const hex =
    typeof value === 'string'
      ? value
      : value !== null &&
          typeof value === 'object' &&
          typeof (value as Partial<ObjectIdLike>).toHexString === 'function'
        ? (value as ObjectIdLike).toHexString()
        : undefined

  return typeof hex === 'string' && HEX_24_REGEX.test(hex) ? hex : undefined
}

export const isValidObjectIdHex = (value: unknown): boolean => getObjectIdHex(value) !== undefined
