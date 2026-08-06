import { performance } from 'node:perf_hooks'

import { describe, expect, it } from 'vitest'

import { isEligibleRequest } from './isEligibleRequest.js'

describe('isEligibleRequest', () => {
  it('should accept multipart POST requests with a body stream when content-length is absent', () => {
    const formData = new FormData()
    formData.append('file', new Blob(['hello world'], { type: 'text/plain' }), 'hello.txt')

    const request = new Request('http://localhost/api/upload', {
      body: formData,
      method: 'POST',
    })

    expect(request.headers.get('content-length')).toBeNull()
    expect(isEligibleRequest(request)).toBe(true)
  })

  it('should reject multipart POST requests when no body is present', () => {
    const request = new Request('http://localhost/api/upload', {
      headers: {
        'content-type': 'multipart/form-data; boundary=----test-boundary',
      },
      method: 'POST',
    })

    expect(isEligibleRequest(request)).toBe(false)
  })

  it.each([
    'multipart/form-data; boundary=----test-boundary',
    'multipart/form-data;boundary=unspaced-boundary',
    'multipart/form-data; boundary="quoted-boundary"',
    'multipart/mixed; charset=UTF-8; boundary=mixed-boundary',
    'multipart/related; type=application/json; boundary=related-boundary',
    'multipart/x^foo; note="[a\\b]@c<>"; boundary=special-character-boundary',
  ])('should accept multipart content type %s', (contentType) => {
    const request = new Request('http://localhost/api/upload', {
      body: 'synthetic',
      headers: { 'content-type': contentType },
      method: 'POST',
    })

    expect(isEligibleRequest(request)).toBe(true)
  })

  it('should reject invalid multipart content types promptly', () => {
    const contentType = `multipart/form-data; boundary=${';'.repeat(22)}!`
    const request = new Request('http://localhost/api/upload', {
      body: 'synthetic',
      headers: { 'content-type': contentType },
      method: 'POST',
    })

    const start = performance.now()
    const isEligible = isEligibleRequest(request)
    const duration = performance.now() - start

    expect(isEligible).toBe(false)
    expect(duration).toBeLessThan(20)
  })
})
