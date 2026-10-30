import { describe, expect, it } from 'vitest'

import { getOriginalFilename } from './fileVersioning/naming.js'
import { truncateFilename } from './truncateFilename.js'

describe('truncateFilename', () => {
  it('should retain numeric suffixes when reserving space for generated suffixes', () => {
    const result = truncateFilename({ filename: `${'é'.repeat(127)}-10.jpg`, maxBytes: 246 })

    expect(result).toBe(`${'é'.repeat(119)}-10.jpg`)
  })

  it('should reject an extension that leaves no room for required suffixes', () => {
    expect(() => truncateFilename({ filename: `file.${'a'.repeat(255)}` })).toThrow(
      'Upload filename suffix and extension exceed the filename byte limit',
    )
  })
})

describe('getOriginalFilename', () => {
  it.each(['', '.jpg'])(
    'should preserve the original suffix within the byte limit with extension %s',
    (extension) => {
      const result = getOriginalFilename({ filename: `${'a'.repeat(255)}${extension}` })

      expect(Buffer.byteLength(result)).toBe(255)
      expect(result.endsWith(`-original${extension}`)).toBe(true)
    },
  )

  it('should retain filename validation', () => {
    expect(() => getOriginalFilename({ filename: '../photo.jpg' })).toThrow(
      'Unsafe managed filename',
    )
  })
})
