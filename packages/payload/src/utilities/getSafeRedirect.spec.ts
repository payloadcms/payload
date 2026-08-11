import { describe, it, expect } from 'vitest'
import { getSafeRedirect } from './getSafeRedirect'

const fallback = '/admin' // default fallback if the input is unsafe or invalid

describe('getSafeRedirect', () => {
  // Valid - safe redirect paths
  it.each([['/dashboard'], ['/admin/settings'], ['/projects?id=123'], ['/hello-world']])(
    'should allow safe relative path: %s',
    (input) => {
      // If the input is a clean relative path, it should be returned as-is
      expect(getSafeRedirect({ redirectTo: input, fallbackTo: fallback })).toBe(input)
    },
  )

  // Invalid types or empty inputs
  it.each(['', null, undefined, 123, {}, []])(
    'should fallback on invalid or non-string input: %s',
    (input) => {
      // If the input is not a valid string, it should return the fallback
      expect(getSafeRedirect({ redirectTo: input as any, fallbackTo: fallback })).toBe(fallback)
    },
  )

  it.each([
    'redirect=%2F%09%2Fexample.invalid',
    'redirect=%2F%0D%2Fexample.invalid',
    'redirect=%2F%0A%2Fexample.invalid',
  ])('should use the fallback when a path resolves outside the current origin: %s', (query) => {
    const redirectTo = new URLSearchParams(query).get('redirect')

    expect(redirectTo).not.toBeNull()
    expect(getSafeRedirect({ redirectTo: redirectTo!, fallbackTo: fallback })).toBe(fallback)
  })

  it.each([
    '/%2509/example.invalid',
    '/%250D/example.invalid',
    '/%250A/example.invalid',
    '/%255Cexample.invalid',
    '/%252fexample.invalid',
  ])('should use the fallback for ambiguous encoded path prefixes: %s', (input) => {
    expect(getSafeRedirect({ redirectTo: input, fallbackTo: fallback })).toBe(fallback)
  })

  // Unsafe redirect patterns
  it.each([
    '//example.com', // protocol-relative URL
    '/javascript:alert(1)', // JavaScript scheme
    '/JavaScript:alert(1)', // case-insensitive JavaScript
    '/http://unknown.com', // disguised external redirect
    '/https://unknown.com', // disguised external redirect
    '/%2Funknown.com', // encoded slash — could resolve to //
    '/\\/unknown.com', // escaped slash
    '/\\\\unknown.com', // double escaped slashes
    '/\\unknown.com', // single escaped slash
    '%2F%2Funknown.com', // fully encoded protocol-relative path
    '%2Fjavascript:alert(1)', // encoded JavaScript scheme
  ])('should block unsafe redirect: %s', (input) => {
    // All of these should return the fallback because they’re unsafe
    expect(getSafeRedirect({ redirectTo: input, fallbackTo: fallback })).toBe(fallback)
  })

  // Input with extra spaces should still be properly handled
  it('should trim whitespace before evaluating', () => {
    // A valid path with surrounding spaces should still be accepted
    expect(getSafeRedirect({ redirectTo: '   /dashboard   ', fallbackTo: fallback })).toBe(
      '/dashboard',
    )

    // An unsafe path with spaces should still be rejected
    expect(getSafeRedirect({ redirectTo: '   //example.com   ', fallbackTo: fallback })).toBe(
      fallback,
    )
  })

  it('should return fallback when the input is not a path or URL', () => {
    expect(getSafeRedirect({ redirectTo: '%E0%A4%A', fallbackTo: fallback })).toBe(fallback)
  })

  it('should preserve an accepted local redirect', () => {
    const redirectTo = '/dashboard?tab=overview#details'

    expect(getSafeRedirect({ redirectTo, fallbackTo: fallback })).toBe(redirectTo)
  })

  it('should preserve a parsed navigation target byte-for-byte', () => {
    const redirectTo = new URLSearchParams(
      'redirect=%2Foauth%2Fcallback%3Fcode%3DA%252FB%26state%3Dopaque%253D%23done',
    ).get('redirect')

    expect(redirectTo).toBe('/oauth/callback?code=A%2FB&state=opaque%3D#done')
    expect(getSafeRedirect({ redirectTo: redirectTo!, fallbackTo: fallback })).toBe(
      '/oauth/callback?code=A%2FB&state=opaque%3D#done',
    )
  })

  it.each([
    [
      'https://example.invalid/path?code=A%252FB#done',
      'https://example.invalid/path?code=A%252FB#done',
    ],
    ['http://example.invalid/dashboard', 'http://example.invalid/dashboard'],
  ])('should preserve an HTTP absolute redirect when enabled: %s', (input, expected) => {
    expect(
      getSafeRedirect({
        allowAbsoluteUrls: true,
        redirectTo: input,
        fallbackTo: fallback,
      }),
    ).toBe(expected)
  })

  it.each([
    ['https://example.invalid/path', false],
    ['mailto:user@example.invalid', true],
    ['//example.invalid/path', true],
  ])(
    'should use the fallback without an explicitly enabled HTTP(S) URL: %s',
    (input, allowAbsoluteUrls) => {
      expect(getSafeRedirect({ allowAbsoluteUrls, redirectTo: input, fallbackTo: fallback })).toBe(
        fallback,
      )
    },
  )
})
