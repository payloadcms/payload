import { randomUUID } from 'crypto'
import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { afterEach, describe, expect, it } from 'vitest'

import { inspectSvg, inspectSvgFile, validateSvg } from './validateSvg.js'

const tempFiles: string[] = []

const writeTempFile = async (content: Buffer | string): Promise<string> => {
  const filePath = path.join(os.tmpdir(), `payload-svg-${randomUUID()}`)
  tempFiles.push(filePath)
  await fs.writeFile(filePath, content)
  return filePath
}

afterEach(async () => {
  await Promise.all(tempFiles.splice(0).map((filePath) => fs.unlink(filePath)))
})

describe('SVG inspection', () => {
  it.each([
    ['script elements', '<script>reference()</script>'],
    ['event attributes', '<g onload="reference()"/>'],
    ['embedded HTML', '<foreignObject/>'],
    ['active links', '<a href="javascript:reference()"/>'],
    ['nested SVG data', '<image href="data:image/svg+xml,<svg/>"/>'],
    ['active style attributes', '<g style="background:url(javascript:reference())"/>'],
    ['active style elements', '<style>@import url("reference.css")</style>'],
    [
      'animated active links',
      '<animate attributeName="href" values="https://example.com; javascript:reference()"/>',
    ],
    ['assigned active links', '<set attributeName="href" to="javascript:reference()"/>'],
  ])('should reject %s', (_, content) => {
    expect(
      validateSvg(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg">${content}</svg>`)),
    ).toBe(false)
  })

  it('should reject XML-declared SVG event attributes', () => {
    expect(
      validateSvg(
        Buffer.from(
          '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" onload="reference()"/>',
        ),
      ),
    ).toBe(false)
  })

  it('should inspect complete style content across text and CDATA', () => {
    expect(
      validateSvg(
        Buffer.from(
          '<svg xmlns="http://www.w3.org/2000/svg"><style>@im<![CDATA[port]]> url("reference.css")</style></svg>',
        ),
      ),
    ).toBe(false)
  })

  it('should inspect UTF-16 XML-declared SVG content', () => {
    const content = Buffer.concat([
      Buffer.from([0xff, 0xfe]),
      Buffer.from(
        '<?xml version="1.0" encoding="UTF-16"?><svg xmlns="http://www.w3.org/2000/svg" onload="reference()"/>',
        'utf16le',
      ),
    ])

    expect(inspectSvg(content)).toMatchObject({ isSafe: false, isSvg: true, isValid: true })
  })

  it('should accept ordinary SVG content and external resources', () => {
    expect(
      validateSvg(
        Buffer.from(
          '<svg xmlns="http://www.w3.org/2000/svg"><text>javascript: reference</text><g aria-label="url(javascript: reference)"/><image href="https://example.com/reference.png"/><animate attributeName="fill" values="red;blue"/></svg>',
        ),
      ),
    ).toBe(true)
  })

  it('should accept large ordinary style content', () => {
    expect(
      validateSvg(
        Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg"><style>${'.reference { fill: blue; }'.repeat(50_000)}</style></svg>`,
        ),
      ),
    ).toBe(true)
  })

  it('should stop buffer inspection after a valid non-SVG root is identified', () => {
    expect(inspectSvg(Buffer.from('<feed xmlns="urn:example"><entry>'))).toMatchObject({
      isSafe: false,
      isSvg: false,
      isValid: true,
    })
  })

  it('should stop streaming after a valid non-SVG root is identified', async () => {
    const filePath = await writeTempFile('<feed xmlns="urn:example"><entry>')

    await expect(inspectSvgFile(filePath, { highWaterMark: 64 })).resolves.toMatchObject({
      isSafe: false,
      isSvg: false,
      isValid: true,
    })
  })

  it('should inspect style content across temp-file chunks', async () => {
    const filePath = await writeTempFile(
      '<svg xmlns="http://www.w3.org/2000/svg"><style>@import url("reference.css")</style></svg>',
    )

    await expect(inspectSvgFile(filePath, { highWaterMark: 3 })).resolves.toMatchObject({
      isSafe: false,
      isSvg: true,
      isValid: true,
    })
  })

  it('should handle deeply nested namespace declarations', () => {
    const depth = 10_000
    const elements = Array.from(
      { length: depth },
      (_, index) => `<g xmlns:reference${index}="urn:reference:${index}">`,
    ).join('')
    const source = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg">${elements}${'</g>'.repeat(depth)}</svg>`,
    )
    const startedAt = performance.now()

    expect(validateSvg(source)).toBe(true)
    expect(performance.now() - startedAt).toBeLessThan(5_000)
  })
})
