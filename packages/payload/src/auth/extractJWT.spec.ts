import type { BasePayload } from '../index.js'
import type { PayloadRequest } from '../types/index.js'

import { describe, expect, it } from 'vitest'

import { extractJWT } from './extractJWT.js'

const token = 'test-token'
const serverURL = 'https://cms.example.com'

const createPayload = ({ csrf = [serverURL] }: { csrf?: string[] } = {}) =>
  ({
    config: {
      auth: { jwtOrder: ['JWT', 'Bearer', 'cookie'] },
      cookiePrefix: 'payload',
      csrf,
    },
  }) as unknown as BasePayload

const createHeaders = (headers: Record<string, string> = {}) =>
  new Headers({ cookie: `payload-token=${token}`, ...headers })

const crossSiteNavigationHeaders = {
  'sec-fetch-dest': 'document',
  'sec-fetch-mode': 'navigate',
  'sec-fetch-site': 'cross-site',
}

const extract = ({
  csrf,
  headers,
  method,
}: {
  csrf?: string[]
  headers: Record<string, string>
  method?: string
}) =>
  extractJWT({
    headers: createHeaders(headers),
    payload: createPayload({ csrf }),
    req: method ? ({ method } as PayloadRequest) : undefined,
  })

describe('extractJWT cookie strategy', () => {
  it('accepts the cookie when Origin is in the csrf allowlist', () => {
    expect(extract({ headers: { origin: serverURL } })).toBe(token)
  })

  it('rejects the cookie when Origin is not in the csrf allowlist', () => {
    expect(extract({ headers: { origin: 'https://evil.example' } })).toBeNull()
  })

  it('accepts the cookie when csrf is empty and Origin is absent', () => {
    expect(extract({ csrf: [], headers: { 'sec-fetch-site': 'cross-site' } })).toBe(token)
  })

  it.each(['same-origin', 'same-site', 'none'])('accepts Sec-Fetch-Site: %s', (site) => {
    expect(extract({ headers: { 'sec-fetch-site': site } })).toBe(token)
  })

  it('rejects requests without Sec-Fetch-Site or Origin', () => {
    expect(extract({ headers: {} })).toBeNull()
  })

  it('accepts a cross-site top-level GET navigation', () => {
    expect(extract({ headers: crossSiteNavigationHeaders, method: 'GET' })).toBe(token)
  })

  it('accepts a cross-site top-level HEAD navigation', () => {
    expect(extract({ headers: crossSiteNavigationHeaders, method: 'HEAD' })).toBe(token)
  })

  it('accepts a cross-site top-level navigation when the method is unknown', () => {
    expect(extract({ headers: crossSiteNavigationHeaders })).toBe(token)
  })

  it('rejects a cross-site top-level navigation with an unsafe method', () => {
    expect(extract({ headers: crossSiteNavigationHeaders, method: 'POST' })).toBeNull()
  })

  it('rejects cross-site fetch requests', () => {
    expect(
      extract({
        headers: {
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'cross-site',
        },
        method: 'GET',
      }),
    ).toBeNull()
  })

  it('rejects cross-site navigations into a frame', () => {
    expect(
      extract({
        headers: { ...crossSiteNavigationHeaders, 'sec-fetch-dest': 'iframe' },
        method: 'GET',
      }),
    ).toBeNull()
  })
})
