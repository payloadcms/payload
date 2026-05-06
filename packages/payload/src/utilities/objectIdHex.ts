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

const getRandomBytes = (length: number): Uint8Array => {
  const buf = new Uint8Array(length)
  globalThis.crypto.getRandomValues(buf)
  return buf
}

const PROCESS_RANDOM = getRandomBytes(5)

const initialCounterBytes = getRandomBytes(3)
let counter =
  (((initialCounterBytes[0] ?? 0) << 16) |
    ((initialCounterBytes[1] ?? 0) << 8) |
    (initialCounterBytes[2] ?? 0)) &
  0xffffff

export const generateObjectIdHex = (): string => {
  const time = Math.floor(Date.now() / 1000) & 0xffffffff
  counter = (counter + 1) & 0xffffff
  const inc = counter

  return (
    HEX_TABLE[(time >>> 24) & 0xff]! +
    HEX_TABLE[(time >>> 16) & 0xff]! +
    HEX_TABLE[(time >>> 8) & 0xff]! +
    HEX_TABLE[time & 0xff]! +
    HEX_TABLE[PROCESS_RANDOM[0]!]! +
    HEX_TABLE[PROCESS_RANDOM[1]!]! +
    HEX_TABLE[PROCESS_RANDOM[2]!]! +
    HEX_TABLE[PROCESS_RANDOM[3]!]! +
    HEX_TABLE[PROCESS_RANDOM[4]!]! +
    HEX_TABLE[(inc >>> 16) & 0xff]! +
    HEX_TABLE[(inc >>> 8) & 0xff]! +
    HEX_TABLE[inc & 0xff]!
  )
}

export const isValidObjectIdHex = (value: unknown): boolean =>
  typeof value === 'string' && HEX_24_REGEX.test(value)

export const normalizeObjectIdHex = (value: string): string => value.toLowerCase()
