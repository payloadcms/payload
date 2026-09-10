import type { BasePayload } from '../index.js'

import { describe, expect, it } from 'vitest'

import { extractJWT } from './extractJWT.js'

type MinimalPayload = Pick<BasePayload, 'config'>

const makePayload = (csrf: string[], cookiePrefix = 'payload'): MinimalPayload =>
  ({
    config: {
      auth: { jwtOrder: ['JWT', 'Bearer', 'cookie'] },
      cookiePrefix,
      csrf,
    },
  }) as unknown as MinimalPayload

const makeHeaders = (entries: Record<string, string>): Headers => new Headers(entries)

describe('extractJWT', () => {
  describe('cookie strategy', () => {
    it('returns null when there is no token cookie', () => {
      const headers = makeHeaders({})
      const payload = makePayload(['https://myapp.com'])

      expect(extractJWT({ headers, payload: payload as BasePayload })).toBeNull()
    })

    it('accepts a matching Origin against the csrf allowlist', () => {
      const headers = makeHeaders({
        Cookie: 'payload-token=abc',
        Origin: 'https://myapp.com',
      })
      const payload = makePayload(['https://myapp.com'])

      expect(extractJWT({ headers, payload: payload as BasePayload })).toBe('abc')
    })

    it('rejects a non-matching Origin against the csrf allowlist', () => {
      const headers = makeHeaders({
        Cookie: 'payload-token=abc',
        Origin: 'https://attacker.com',
      })
      const payload = makePayload(['https://myapp.com'])

      expect(extractJWT({ headers, payload: payload as BasePayload })).toBeNull()
    })

    it('accepts Sec-Fetch-Site: same-origin when Origin is absent', () => {
      const headers = makeHeaders({
        Cookie: 'payload-token=abc',
        'Sec-Fetch-Site': 'same-origin',
      })
      const payload = makePayload(['https://myapp.com'])

      expect(extractJWT({ headers, payload: payload as BasePayload })).toBe('abc')
    })

    it('rejects Sec-Fetch-Site: cross-site when Origin is absent', () => {
      const headers = makeHeaders({
        Cookie: 'payload-token=abc',
        'Sec-Fetch-Site': 'cross-site',
      })
      const payload = makePayload(['https://myapp.com'])

      expect(extractJWT({ headers, payload: payload as BasePayload })).toBeNull()
    })

    it('falls back to a matching Referer origin when both Origin and Sec-Fetch-Site are absent (regression #17565)', () => {
      const headers = makeHeaders({
        Cookie: 'payload-token=abc',
        Referer: 'http://myapp.local/admin/login',
      })
      const payload = makePayload(['http://myapp.local'])

      expect(extractJWT({ headers, payload: payload as BasePayload })).toBe('abc')
    })

    it('rejects a non-matching Referer origin when both Origin and Sec-Fetch-Site are absent', () => {
      const headers = makeHeaders({
        Cookie: 'payload-token=abc',
        Referer: 'http://attacker.local/admin/login',
      })
      const payload = makePayload(['http://myapp.local'])

      expect(extractJWT({ headers, payload: payload as BasePayload })).toBeNull()
    })

    it('rejects a malformed Referer when both Origin and Sec-Fetch-Site are absent', () => {
      const headers = makeHeaders({
        Cookie: 'payload-token=abc',
        Referer: 'not-a-url',
      })
      const payload = makePayload(['http://myapp.local'])

      expect(extractJWT({ headers, payload: payload as BasePayload })).toBeNull()
    })

    it('rejects when Origin, Sec-Fetch-Site, and Referer are all absent and csrf is configured', () => {
      const headers = makeHeaders({
        Cookie: 'payload-token=abc',
      })
      const payload = makePayload(['https://myapp.com'])

      expect(extractJWT({ headers, payload: payload as BasePayload })).toBeNull()
    })

    it('accepts the cookie when csrf is not configured, even without Origin, Sec-Fetch-Site, or Referer', () => {
      const headers = makeHeaders({
        Cookie: 'payload-token=abc',
      })
      const payload = makePayload([])

      expect(extractJWT({ headers, payload: payload as BasePayload })).toBe('abc')
    })
  })
})
