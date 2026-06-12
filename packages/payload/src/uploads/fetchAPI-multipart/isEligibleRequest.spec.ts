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
})
