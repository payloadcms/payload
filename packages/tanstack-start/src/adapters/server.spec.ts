import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getResponseHeaders } = vi.hoisted(() => ({
  getResponseHeaders: vi.fn(),
}))

vi.mock('@tanstack/react-start/server', () => ({
  getRequest: vi.fn(),
  getResponseHeaders,
}))

import { tanstackServerAdapter } from './server.js'

describe('tanstackServerAdapter', () => {
  beforeEach(() => {
    getResponseHeaders.mockReset()
  })

  it('should append multiple cookies to the response headers', () => {
    const append = vi.fn()

    getResponseHeaders.mockReturnValue({ append })

    tanstackServerAdapter.setCookie('auth-cookie', 'auth-value', {
      httpOnly: true,
      path: '/',
    })
    tanstackServerAdapter.setCookie('language-cookie', 'en', { path: '/' })

    expect(append).toHaveBeenNthCalledWith(
      1,
      'Set-Cookie',
      'auth-cookie=auth-value; Path=/; HttpOnly',
    )
    expect(append).toHaveBeenNthCalledWith(2, 'Set-Cookie', 'language-cookie=en; Path=/')
  })
})
