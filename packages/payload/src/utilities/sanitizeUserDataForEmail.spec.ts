import { describe, it, expect } from 'vitest'
import { sanitizeUserDataForEmail } from './sanitizeUserDataForEmail'

describe('sanitizeUserDataForEmail', () => {
  it('should remove anchor tags', () => {
    const input = '<a href="https://example.com">Click me</a>'
    const result = sanitizeUserDataForEmail(input)
    expect(result).toBe('Click me')
  })

  it('should remove script tags', () => {
    const unsanitizedData = '<script>alert</script>'
    const sanitizedData = sanitizeUserDataForEmail(unsanitizedData)
    expect(sanitizedData).toBe('alert')
  })

  it('should remove mixed-case script tags', () => {
    const input = '<ScRipT>alert(1)</sCrIpT>'
    const result = sanitizeUserDataForEmail(input)
    expect(result).toBe('alert1')
  })

  it('should remove embedded base64-encoded scripts', () => {
    const input = '<img src="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">'
    const result = sanitizeUserDataForEmail(input)
    expect(result).toBe('')
  })

  it('should remove iframe elements', () => {
    const input = '<iframe src="malicious.com"></iframe>Frame'
    const result = sanitizeUserDataForEmail(input)
    expect(result).toBe('Frame')
  })

  it('should remove javascript: links in attributes', () => {
    const input = '<a href="javascript:alert(1)">click</a>'
    const result = sanitizeUserDataForEmail(input)
    expect(result).toBe('click')
  })

  it('should remove mismatched script input', () => {
    const input = '<script>console.log("test")'
    const result = sanitizeUserDataForEmail(input)
    expect(result).toBe('console.log\"test\"')
  })

  it('should remove encoded scripts via HTML entities', () => {
    const input = '&#x3C;script&#x3E;alert(1)&#x3C;/script&#x3E;'
    const result = sanitizeUserDataForEmail(input)
    expect(result).toBe('alert1')
  })

  it('should remove template injection syntax', () => {
    const input = '{{7*7}}'
    const result = sanitizeUserDataForEmail(input)
    expect(result).toBe('77')
  })

  it('should remove invisible zero-width characters', () => {
    const input = 'a\u200Bler\u200Bt("XSS")'
    const result = sanitizeUserDataForEmail(input)
    expect(result).toBe('alert\"XSS\"')
  })

  it('should remove CSS expressions within style attributes', () => {
    const input = '<div style="width: expression(alert(\'XSS\'));">Hello</div>'
    const result = sanitizeUserDataForEmail(input)
    expect(result).toBe('Hello')
  })

  it('should not render SVG with onload event', () => {
    const input = '<svg onload="alert(\'XSS\')">Graphic</svg>'
    const result = sanitizeUserDataForEmail(input)
    expect(result).toBe('Graphic')
  })

  it('should not allow backtick-based patterns', () => {
    const input = '`alert("XSS")`'
    const result = sanitizeUserDataForEmail(input)
    expect(result).toBe('alert\"XSS\"')
  })

  it('should preserve allowed punctuation', () => {
    const input = `Hello "world" - it's safe!`
    const result = sanitizeUserDataForEmail(input)
    expect(result).toBe(`Hello "world" - it's safe!`)
  })

  it('should return empty string for non-string input', () => {
    expect(sanitizeUserDataForEmail(null)).toBe('')
    expect(sanitizeUserDataForEmail(undefined)).toBe('')
    expect(sanitizeUserDataForEmail(123)).toBe('')
    expect(sanitizeUserDataForEmail({})).toBe('')
  })

  it('should return empty string for an empty string', () => {
    expect(sanitizeUserDataForEmail('')).toBe('')
  })

  it('should collapse excessive whitespace', () => {
    const input = 'This    is \n\n a    test'
    expect(sanitizeUserDataForEmail(input)).toBe('This is a test')
  })

  it('should truncate to maxLength characters', () => {
    const input = 'a'.repeat(200)
    const result = sanitizeUserDataForEmail(input, 50)
    expect(result.length).toBe(50)
  })

  it('should remove characters outside allowed punctuation', () => {
    const input = 'Hello @#$%^*()_+=[]{}|\\~`'
    const result = sanitizeUserDataForEmail(input)
    expect(result).toBe('Hello')
  })
  it('should sanitize syntax in regex-like input', () => {
    const input = '(?=XSS)(?:abc)'
    const result = sanitizeUserDataForEmail(input)
    expect(result).toBe('XSSabc')
  })

  it('should handle string of only control characters', () => {
    const input = '\x01\x02\x03\x04'
    const result = sanitizeUserDataForEmail(input)
    expect(result).toBe('')
  })

  it('should sanitize complex script attempt with mixed encoding', () => {
    const input = '&#x3C;script&#x3E;alert(String.fromCharCode(88,83,83))&#x3C;/script&#x3E;'
    const result = sanitizeUserDataForEmail(input)
    expect(result).toBe('alertString.fromCharCode88,83,83')
  })

  it('should handle deeply nested HTML tags correctly', () => {
    const input = `<div><section><article><p>Hello <strong>world <em>from <span>deep <a href="#">tags</a></span></em></strong></p></article></section></div>`
    const result = sanitizeUserDataForEmail(input)
    expect(result).toBe('Hello world from deep tags')
  })

  it('should preserve accented Spanish characters', () => {
    const input = '¡Hola! ¿Cómo estás? ÁÉÍÓÚ ÜÑ ñáéíóú ü'
    const result = sanitizeUserDataForEmail(input)
    expect(result).toBe('¡Hola! ¿Cómo estás? ÁÉÍÓÚ ÜÑ ñáéíóú ü')
  })

  it('should preserve Arabic characters with diacritics', () => {
    const input = 'مَرْحَبًا بِكَ فِي الْمَوْقِعِ'
    const result = sanitizeUserDataForEmail(input)
    expect(result).toBe('مَرْحَبًا بِكَ فِي الْمَوْقِعِ')
  })

  it('should preserve Japanese characters', () => {
    const input = 'こんにちゎ、世界！！〆'
    const result = sanitizeUserDataForEmail(input)
    expect(result).toBe('こんにちゎ、世界！！〆')
  })
})
