import { describe, expect, it } from 'vitest'

import { detectSvgFromXml } from './detectSvgFromXml.js'

describe('detectSvgFromXml', () => {
  it('detects a basic SVG with XML declaration', () => {
    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
  <circle cx="50" cy="50" r="40"/>
</svg>`
    expect(detectSvgFromXml(Buffer.from(svgContent))).toBe(true)
  })

  it('detects an SVG with a DOCTYPE declaration (the reported bug)', () => {
    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
  <circle cx="50" cy="50" r="40"/>
</svg>`
    expect(detectSvgFromXml(Buffer.from(svgContent))).toBe(true)
  })

  it('detects a plain SVG without XML declaration or DOCTYPE', () => {
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
  <rect width="100" height="100"/>
</svg>`
    expect(detectSvgFromXml(Buffer.from(svgContent))).toBe(true)
  })

  it('returns false for an HTML file', () => {
    const htmlContent = `<!DOCTYPE html>
<html>
  <body><p>Hello</p></body>
</html>`
    expect(detectSvgFromXml(Buffer.from(htmlContent))).toBe(false)
  })

  it('returns false for an XML file that is not SVG', () => {
    const xmlContent = `<?xml version="1.0"?>
<root xmlns="http://example.com">
  <item>test</item>
</root>`
    expect(detectSvgFromXml(Buffer.from(xmlContent))).toBe(false)
  })

  it('returns false for an SVG without the required namespace', () => {
    const svgContent = `<svg width="100" height="100">
  <circle cx="50" cy="50" r="40"/>
</svg>`
    expect(detectSvgFromXml(Buffer.from(svgContent))).toBe(false)
  })

  it('returns false for an empty buffer', () => {
    expect(detectSvgFromXml(Buffer.from(''))).toBe(false)
  })
})
