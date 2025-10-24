import { describe, it, expect } from 'vitest'
import { parseCookies } from './cookies.js'

describe('parseCookies', () => {
  it('parses cookie attributes without values', () => {
    const fakeHeaders = new Map()
    fakeHeaders.set('Cookie', 'my_value=true; Secure; HttpOnly')

    const parsed = parseCookies(fakeHeaders as unknown as Request['headers'])

    expect(parsed.get('my_value')).toBe('true')
    expect(parsed.get('Secure')).toBe('true')
    expect(parsed.get('HttpOnly')).toBe('true')
    expect(parsed.size).toBe(3)
  })
  it('strips whitespace', () => {
    const fakeHeaders = new Map()
    fakeHeaders.set('Cookie', 'my_value=true; ')

    const parsed = parseCookies(fakeHeaders as unknown as Request['headers'])

    expect(parsed.get('my_value')).toBe('true')
    expect(parsed.size).toBe(1)
  })

  it('ensure invalid cookies are ignored', () => {
    const fakeHeaders = new Map()
    fakeHeaders.set('Cookie', 'my_value=true; invalid_cookie=%E0%A4%A')

    const parsed = parseCookies(fakeHeaders as unknown as Request['headers'])

    expect(parsed.get('my_value')).toBe('true')
    expect(parsed.size).toBe(1)
  })

  it('ensure empty map is returned if there are no cookies', () => {
    const fakeHeaders = new Map()

    const parsed = parseCookies(fakeHeaders as unknown as Request['headers'])

    expect(parsed.size).toBe(0)
  })
})
