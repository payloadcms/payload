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
})
