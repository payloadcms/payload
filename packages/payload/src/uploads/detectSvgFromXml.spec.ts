import { describe, expect, it } from 'vitest'

import { detectSvgFromXml } from './detectSvgFromXml.js'

const buf = (s: string) => Buffer.from(s, 'utf8')

describe('detectSvgFromXml', () => {
  it('detects a plain SVG', () => {
    expect(
      detectSvgFromXml(
        buf('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>'),
      ),
    ).toBe(true)
  })

  it('detects SVG with an XML declaration', () => {
    expect(
      detectSvgFromXml(
        buf('<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg"></svg>'),
      ),
    ).toBe(true)
  })

  it('detects SVG with a full SVG 1.1 DOCTYPE (Illustrator/Inkscape export)', () => {
    expect(
      detectSvgFromXml(
        buf(
          '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' +
            '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n' +
            '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>',
        ),
      ),
    ).toBe(true)
  })

  it('detects SVG with a bare DOCTYPE', () => {
    expect(
      detectSvgFromXml(buf('<!DOCTYPE svg>\n<svg xmlns="http://www.w3.org/2000/svg"></svg>')),
    ).toBe(true)
  })

  it('detects SVG with an internal DOCTYPE subset', () => {
    expect(
      detectSvgFromXml(
        buf(
          '<!DOCTYPE svg [\n  <!ENTITY ns "http://www.w3.org/2000/svg">\n]>\n' +
            '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
        ),
      ),
    ).toBe(true)
  })

  it('returns false for non-SVG XML', () => {
    expect(detectSvgFromXml(buf('<?xml version="1.0"?><root><child/></root>'))).toBe(false)
  })

  it('returns false when SVG namespace is missing', () => {
    expect(detectSvgFromXml(buf('<svg width="10"></svg>'))).toBe(false)
  })

  it('returns false for an empty buffer', () => {
    expect(detectSvgFromXml(buf(''))).toBe(false)
  })
})
