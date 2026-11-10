import { describe, expect, it } from 'vitest'

import { truncateFilename } from './truncateFilename.js'

describe('truncateFilename', () => {
  it('should retain numeric suffixes when shortening the filename', () => {
    const result = truncateFilename({ filename: `${'é'.repeat(127)}-10.jpg`, maxBytes: 246 })

    expect(result).toBe(`${'é'.repeat(119)}-10.jpg`)
  })

  it('should reject an extension that leaves no room for required suffixes', () => {
    expect(() => truncateFilename({ filename: `file.${'a'.repeat(255)}` })).toThrow(
      'Upload filename suffix and extension exceed the filename byte limit',
    )
  })
})
