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
})
