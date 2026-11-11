import { describe, expect, it } from 'vitest'

import { truncateFilename } from './truncateFilename.js'

describe('truncateFilename', () => {
  it('should retain numeric suffixes when shortening the filename', () => {
    const result = truncateFilename({ filename: `${'é'.repeat(127)}-10.jpg`, maxBytes: 246 })

    expect(result).toBe(`${'é'.repeat(119)}-10.jpg`)
  })

  it('should reject an overlong multibyte extension as invalid input', () => {
    expect(() => truncateFilename({ filename: `a.${'é'.repeat(128)}` })).toThrow(
      expect.objectContaining({
        message: 'Upload filename extension exceeds the filename byte limit',
        status: 400,
      }),
    )
  })

  it('should report a conflict when a collision suffix cannot fit beside the extension', () => {
    expect(() => truncateFilename({ filename: `a-1.${'x'.repeat(253)}` })).toThrow(
      expect.objectContaining({
        message: 'Unable to find an available upload filename',
        status: 409,
      }),
    )
  })
})
