import { describe, expect, it } from 'vitest'
import { sanitizeUrl } from './sanitizeUrl.js'

describe('sanitizeUrl', () => {
  it('returns empty string for empty input', () => {
    expect(sanitizeUrl('')).toBe('')
  })

  it('allows valid http and https URLs', () => {
    expect(sanitizeUrl('https://payloadcms.com')).toBe('https://payloadcms.com')
    expect(sanitizeUrl('http://localhost:3000/admin')).toBe('http://localhost:3000/admin')
  })

  it('allows mailto and tel links', () => {
    expect(sanitizeUrl('mailto:test@example.com')).toBe('mailto:test@example.com')
    expect(sanitizeUrl('tel:+1234567890')).toBe('tel:+1234567890')
  })

  it('allows fragment-only URLs', () => {
    expect(sanitizeUrl('#section')).toBe('#section')
  })

  it('allows relative paths', () => {
    expect(sanitizeUrl('/admin/collections')).toBe('/admin/collections')
    expect(sanitizeUrl('./relative/path')).toBe('./relative/path')
    expect(sanitizeUrl('../parent/path')).toBe('../parent/path')
  })

  it('rejects protocol-relative URLs', () => {
    expect(sanitizeUrl('//evil.com')).toBe('#')
    expect(sanitizeUrl('/\\evil.com')).toBe('#')
    expect(sanitizeUrl('\\\\evil.com')).toBe('#')
  })

  it('rejects dangerous protocols', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('#')
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('#')
    expect(sanitizeUrl('vbscript:msgbox(1)')).toBe('#')
    expect(sanitizeUrl('file:///etc/passwd')).toBe('#')
  })

  it('trims whitespace and strips control characters', () => {
    expect(sanitizeUrl('  https://payloadcms.com  ')).toBe('https://payloadcms.com')
    expect(sanitizeUrl('\x00javascript:alert(1)')).toBe('#')
  })
})
