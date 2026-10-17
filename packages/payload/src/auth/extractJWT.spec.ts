import { describe, expect, it } from 'vitest'

import type { BasePayload } from '../index.js'

import { extractJWT } from './extractJWT.js'

function createHeaders(entries: Record<string, string>): Headers {
  const headers = new Headers()
  for (const [key, value] of Object.entries(entries)) {
    headers.set(key, value)
  }
  return headers
}

function createPayload(overrides: { csrf?: string[] } = {}): BasePayload {
  return {
    config: {
      auth: {
        jwtOrder: ['cookie'],
      },
      cookiePrefix: 'payload',
      csrf: overrides.csrf ?? [],
    },
  } as unknown as BasePayload
}

describe('extractJWT', () => {
  const token = 'test-jwt-token'
  const cookieHeader = `payload-token=${token}`
  const allowedOrigin = 'http://localhost:3000'
  const maliciousOrigin = 'http://evil.com'
  const payloadWithCsrf = createPayload({ csrf: [allowedOrigin] })

  describe('cookie extraction', () => {
    it('should return null without cookie', () => {
      const result = extractJWT({
        headers: createHeaders({}),
        payload: createPayload(),
      })

      expect(result).toBeNull()
    })

    it('should return cookie without csrf configured', () => {
      const result = extractJWT({
        headers: createHeaders({ Cookie: cookieHeader }),
        payload: createPayload({ csrf: [] }),
      })

      expect(result).toBe(token)
    })

    it('should return cookie when Origin matches csrf allowlist', () => {
      const result = extractJWT({
        headers: createHeaders({
          Cookie: cookieHeader,
          Origin: allowedOrigin,
        }),
        payload: payloadWithCsrf,
      })

      expect(result).toBe(token)
    })

    it('should reject cookie when Origin not in csrf allowlist', () => {
      const result = extractJWT({
        headers: createHeaders({
          Cookie: cookieHeader,
          Origin: maliciousOrigin,
        }),
        payload: payloadWithCsrf,
      })

      expect(result).toBeNull()
    })

    it('should allow same-origin requests with csrf', () => {
      const result = extractJWT({
        headers: createHeaders({
          Cookie: cookieHeader,
          'Sec-Fetch-Site': 'same-origin',
        }),
        payload: payloadWithCsrf,
      })

      expect(result).toBe(token)
    })

    it('should allow same-site requests with csrf', () => {
      const result = extractJWT({
        headers: createHeaders({
          Cookie: cookieHeader,
          'Sec-Fetch-Site': 'same-site',
        }),
        payload: payloadWithCsrf,
      })

      expect(result).toBe(token)
    })

    it('should allow direct navigations (Sec-Fetch-Site: none) with csrf', () => {
      const result = extractJWT({
        headers: createHeaders({
          Cookie: cookieHeader,
          'Sec-Fetch-Site': 'none',
        }),
        payload: payloadWithCsrf,
      })

      expect(result).toBe(token)
    })

    it('should allow cross-site navigations (e.g. email links) with csrf', () => {
      const result = extractJWT({
        headers: createHeaders({
          Cookie: cookieHeader,
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'cross-site',
        }),
        payload: payloadWithCsrf,
      })

      expect(result).toBe(token)
    })

    it('should allow navigate mode without Sec-Fetch-Site header', () => {
      const result = extractJWT({
        headers: createHeaders({
          Cookie: cookieHeader,
          'Sec-Fetch-Mode': 'navigate',
        }),
        payload: payloadWithCsrf,
      })

      expect(result).toBe(token)
    })

    it('should reject cross-site non-navigation requests with csrf', () => {
      const result = extractJWT({
        headers: createHeaders({
          Cookie: cookieHeader,
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'cross-site',
        }),
        payload: payloadWithCsrf,
      })

      expect(result).toBeNull()
    })

    it('should reject requests without Sec-Fetch headers with csrf', () => {
      const result = extractJWT({
        headers: createHeaders({
          Cookie: cookieHeader,
        }),
        payload: payloadWithCsrf,
      })

      expect(result).toBeNull()
    })
  })

  describe('Bearer extraction', () => {
    it('should extract Bearer token', () => {
      const payload = createPayload()
      payload.config.auth.jwtOrder = ['Bearer']

      const result = extractJWT({
        headers: createHeaders({ Authorization: `Bearer ${token}` }),
        payload,
      })

      expect(result).toBe(token)
    })
  })

  describe('JWT extraction', () => {
    it('should extract JWT token', () => {
      const payload = createPayload()
      payload.config.auth.jwtOrder = ['JWT']

      const result = extractJWT({
        headers: createHeaders({ Authorization: `JWT ${token}` }),
        payload,
      })

      expect(result).toBe(token)
    })
  })
})
