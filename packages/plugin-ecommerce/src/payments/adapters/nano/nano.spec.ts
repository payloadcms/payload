import { describe, expect, it } from 'vitest'

import {
  accountFromPublicKey,
  bindingCommitmentHex,
  bindingRepresentative,
  blake2b,
  isBlockHash,
  isValidAccount,
  normalizeAccount,
  publicKeyFromAccount,
  quoteRaw,
  RAW_PER_XNO,
  rawToXno,
  sha256Hex,
  verifySendBlock,
  xnoToRaw,
} from './nano.js'

// Published vectors: the Nano genesis account and the all-zero "burn" account.
const GENESIS = 'nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3'
const GENESIS_KEY = 'E89208DD038FBB269987689621D52292AE9C35941A7484756ECCED92A65093BA'
const BURN = 'nano_1111111111111111111111111111111111111111111111111111hifc8npp'

const hex = (bytes: Uint8Array) => Buffer.from(bytes).toString('hex')

const NOW = 1_800_000_000

const createBlock = (
  overrides: Record<string, unknown> = {},
  contents: Record<string, unknown> = {},
) => {
  const priceRaw = xnoToRaw('0.5')

  return {
    amount: priceRaw.toString(),
    confirmed: 'true',
    local_timestamp: String(NOW - 60),
    subtype: 'send',
    ...overrides,
    contents: {
      link_as_account: GENESIS,
      representative: bindingRepresentative({ payTo: GENESIS, priceRaw, reference: 'order-7f3a' }),
      type: 'state',
      ...contents,
    },
  }
}

const verify = (block: ReturnType<typeof createBlock>) =>
  verifySendBlock({
    block,
    maxAgeSeconds: 86400,
    now: NOW,
    payTo: GENESIS,
    priceRaw: xnoToRaw('0.5'),
    reference: 'order-7f3a',
  })

describe('Nano BLAKE2b', () => {
  it('should match the RFC 7693 BLAKE2b-512 vector for "abc"', () => {
    expect(hex(blake2b(new TextEncoder().encode('abc'), 64))).toBe(
      'ba80a53f981c4d0d6a2797b69f12f6e94c212f14685ac4b74b12bb6fdbffa2d1' +
        '7d87c5392aab792dc252d5de4533cc9518d38aa8dbf1925ab92386edd4009923',
    )
  })

  it('should hash input longer than one block', () => {
    const input = new Uint8Array(300).map((_, i) => i & 0xff)
    expect(blake2b(input, 64)).toHaveLength(64)
    expect(hex(blake2b(input, 32))).not.toBe(hex(blake2b(input.subarray(0, 299), 32)))
  })
})

describe('Nano SHA-256', () => {
  it('should match the FIPS 180-4 vectors', () => {
    expect(sha256Hex('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    )
    expect(sha256Hex('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
    expect(sha256Hex('a'.repeat(1000))).toBe(
      '41edece42d63e8d9bf515a9ba6932e1c20cbc9f5a5d134645adb5db1b9737ea3',
    )
  })
})

describe('Nano addresses', () => {
  it('should encode and decode the genesis account', () => {
    expect(accountFromPublicKey(GENESIS_KEY)).toBe(GENESIS)
    expect(publicKeyFromAccount(GENESIS)).toBe(GENESIS_KEY)
  })

  it('should encode the all-zero key as the burn account', () => {
    expect(accountFromPublicKey('00'.repeat(32))).toBe(BURN)
  })

  it('should accept the legacy xrb_ prefix as the same account', () => {
    expect(normalizeAccount(GENESIS.replace('nano_', 'xrb_'))).toBe(GENESIS)
  })

  it('should reject an address whose checksum does not match', () => {
    const tampered = GENESIS.slice(0, -1) + (GENESIS.endsWith('3') ? '4' : '3')
    expect(isValidAccount(tampered)).toBe(false)
    expect(() => publicKeyFromAccount(tampered)).toThrow('checksum')
  })

  it('should reject malformed addresses', () => {
    expect(isValidAccount('')).toBe(false)
    expect(isValidAccount('nano_123')).toBe(false)
    expect(isValidAccount(GENESIS.replace('nano_', 'ban_'))).toBe(false)
  })
})

describe('Nano amounts', () => {
  it('should derive raw from XNO without floating point', () => {
    expect(xnoToRaw('1')).toBe(RAW_PER_XNO)
    expect(xnoToRaw('0.000001')).toBe(RAW_PER_XNO / 1_000_000n)
    expect(rawToXno(xnoToRaw('12.000034'))).toBe('12.000034')
    expect(rawToXno(1n)).toBe('0.' + '0'.repeat(29) + '1')
  })

  it('should reject amounts that are not plain decimals', () => {
    expect(() => xnoToRaw('1e3')).toThrow()
    expect(() => xnoToRaw('-1')).toThrow()
    expect(() => xnoToRaw('0.' + '1'.repeat(31))).toThrow()
  })

  it('should quote an exact raw price from the smallest currency unit', () => {
    expect(quoteRaw({ amount: 1999, xnoPerUnit: '0.0001' })).toBe(1999n * xnoToRaw('0.0001'))
    expect(() => quoteRaw({ amount: 10.5, xnoPerUnit: '0.0001' })).toThrow()
    expect(() => quoteRaw({ amount: 100, xnoPerUnit: '0' })).toThrow()
  })
})

describe('Nano order binding (xno-binding v1, option C)', () => {
  it('should match the commitment computed by an independent implementation', () => {
    expect(
      bindingCommitmentHex({ payTo: GENESIS, priceRaw: xnoToRaw('0.5'), reference: 'order-7f3a' }),
    ).toBe('ea486467fa668371ccc393f2766c341691a4d327950e131d9dbe84ee5d6fd4fa')
    expect(
      bindingRepresentative({ payTo: GENESIS, priceRaw: xnoToRaw('0.5'), reference: 'order-7f3a' }),
    ).toBe('nano_3tkaejmznsn5g98e96zkgsp5a7njnmbkh7ag4egsuhn6xsgpzo9tf6pipisu')
  })

  it('should give each order and each price its own representative', () => {
    const base = { payTo: GENESIS, priceRaw: xnoToRaw('0.5'), reference: 'order-7f3a' }
    expect(bindingRepresentative({ ...base, reference: 'order-7f3b' })).not.toBe(
      bindingRepresentative(base),
    )
    expect(bindingRepresentative({ ...base, priceRaw: base.priceRaw + 1n })).not.toBe(
      bindingRepresentative(base),
    )
  })
})

describe('Nano send block check', () => {
  it('should accept a confirmed send of the exact amount bound to the order', () => {
    expect(() => verify(createBlock())).not.toThrow()
  })

  it('should reject an unconfirmed block', () => {
    expect(() => verify(createBlock({ confirmed: 'false' }))).toThrow('not confirmed')
  })

  it('should reject a block that is not a send', () => {
    expect(() => verify(createBlock({ subtype: 'receive' }))).toThrow('not a send')
  })

  it('should reject a send to another account', () => {
    expect(() => verify(createBlock({}, { link_as_account: BURN }))).toThrow('another account')
  })

  it('should reject an underpaying or overpaying send', () => {
    const priceRaw = xnoToRaw('0.5')
    expect(() => verify(createBlock({ amount: (priceRaw - 1n).toString() }))).toThrow('amount')
    expect(() => verify(createBlock({ amount: (priceRaw + 1n).toString() }))).toThrow('amount')
  })

  it('should reject a send bound to another order', () => {
    const otherOrder = bindingRepresentative({
      payTo: GENESIS,
      priceRaw: xnoToRaw('0.5'),
      reference: 'order-other',
    })
    expect(() => verify(createBlock({}, { representative: otherOrder }))).toThrow('another order')
  })

  it('should reject a send outside the accepted time window', () => {
    expect(() => verify(createBlock({ local_timestamp: String(NOW - 86401) }))).toThrow('window')
  })

  it('should recognise block hashes', () => {
    expect(isBlockHash('A'.repeat(64))).toBe(true)
    expect(isBlockHash('A'.repeat(63))).toBe(false)
    expect(isBlockHash('Z'.repeat(64))).toBe(false)
  })
})
