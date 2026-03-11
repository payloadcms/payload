import type { PayloadRequest } from '../types/index.js'

import { describe, expect, it } from 'vitest'

import { getRequestOrigin } from './getRequestOrigin'

type MinimalReq = Pick<PayloadRequest, 'headers' | 'payload' | 'url'>

const makeReq = (url: string, hostOverride?: string): MinimalReq => {
  let host = hostOverride
  if (host === undefined) {
    try {
      host = new URL(url).host
    } catch {
      host = undefined
    }
  }
  return {
    url,
    headers: new Headers(host !== undefined ? { host } : {}),
    payload: {},
  } as unknown as MinimalReq
}

describe('getRequestOrigin', () => {
  describe('when config.serverURL is set', () => {
    it('should return serverURL regardless of Host header', () => {
      const req = makeReq('https://ignored.com/api/forgot-password', 'attacker.com')
      const result = getRequestOrigin({
        config: { serverURL: 'https://myapp.com', cors: '*', csrf: [] },
        req,
      })
      expect(result).toBe('https://myapp.com')
    })
  })

  describe('when config.serverURL is not set', () => {
    describe('CORS allowlist validation', () => {
      it('should return origin when Host header matches a CORS string array entry', () => {
        const req = makeReq('https://myapp.com/api/forgot-password')
        const result = getRequestOrigin({
          config: { serverURL: '', cors: ['https://myapp.com', 'https://other.com'], csrf: [] },
          req,
        })
        expect(result).toBe('https://myapp.com')
      })

      it('should return origin when Host header matches a CORSConfig origins entry', () => {
        const req = makeReq('https://myapp.com/api/verify')
        const result = getRequestOrigin({
          config: {
            serverURL: '',
            cors: { headers: [], origins: ['https://myapp.com'] },
            csrf: [],
          },
          req,
        })
        expect(result).toBe('https://myapp.com')
      })

      it('should return empty string when Host header is forged and not in CORS allowlist', () => {
        const req = makeReq('https://myapp.com/api/forgot-password', 'attacker.com')
        const result = getRequestOrigin({
          config: { serverURL: '', cors: ['https://myapp.com'], csrf: [] },
          req,
        })
        expect(result).toBe('')
      })
    })

    describe('CSRF allowlist validation', () => {
      it('should return origin when Host header matches a CSRF entry', () => {
        const req = makeReq('https://myapp.com/api/verify')
        const result = getRequestOrigin({
          config: { serverURL: '', cors: [], csrf: ['https://myapp.com'] },
          req,
        })
        expect(result).toBe('https://myapp.com')
      })

      it('should return origin when Host header is in CSRF but not in CORS', () => {
        const req = makeReq('https://myapp.com/api/verify')
        const result = getRequestOrigin({
          config: {
            serverURL: '',
            cors: ['https://other.com'],
            csrf: ['https://myapp.com'],
          },
          req,
        })
        expect(result).toBe('https://myapp.com')
      })
    })

    describe('malformed or missing Host header', () => {
      it('should return empty string when req.url is not a valid URL', () => {
        const req = makeReq('not-a-url')
        const result = getRequestOrigin({
          config: { serverURL: '', cors: [], csrf: [] },
          req,
        })
        expect(result).toBe('')
      })

      it('should return empty string when Host header is absent', () => {
        const req = makeReq('https://myapp.com/api/forgot-password', '')
        const result = getRequestOrigin({
          config: { serverURL: '', cors: ['https://myapp.com'], csrf: [] },
          req,
        })
        expect(result).toBe('')
      })
    })
  })
})
