import { getSafeRedirect } from './getSafeRedirect'

const fallback = '/admin' // default fallback if the input is unsafe or invalid

describe('getSafeRedirect', () => {
  // Valid - safe redirect paths
  it.each([['/dashboard'], ['/admin/settings'], ['/projects?id=123'], ['/hello-world']])(
    'should allow safe relative path: %s',
    (input) => {
      // If the input is a clean relative path, it should be returned as-is
      expect(getSafeRedirect(input, fallback)).toBe(input)
    },
  )

  // Invalid types or empty inputs
  it.each(['', null, undefined, 123, {}, []])(
    'should fallback on invalid or non-string input: %s',
    (input) => {
      // If the input is not a valid string, it should return the fallback
      expect(getSafeRedirect(input as any, fallback)).toBe(fallback)
    },
  )

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
    expect(getSafeRedirect(input, fallback)).toBe(fallback)
  })

  // Input with extra spaces should still be properly handled
  it('should trim whitespace before evaluating', () => {
    // A valid path with surrounding spaces should still be accepted
    expect(getSafeRedirect('   /dashboard   ', fallback)).toBe('/dashboard')

    // An unsafe path with spaces should still be rejected
    expect(getSafeRedirect('   //example.com   ', fallback)).toBe(fallback)
  })

  // If decoding the input fails (e.g., invalid percent encoding), it should not crash
  it('should return fallback on invalid encoding', () => {
    expect(getSafeRedirect('%E0%A4%A', fallback)).toBe(fallback)
  })
})
