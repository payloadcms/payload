import { describe, expect, it } from 'vitest'
import { formatForClipboard } from './formatForClipboard.js'

describe('formatForClipboard', () => {
  it('puts payload first, rest alphabetical', () => {
    expect(
      formatForClipboard({
        '@payloadcms/ui': '3.0.0',
        '@payloadcms/db-mongodb': '3.0.0',
        payload: '3.0.0',
      }),
    ).toBe('payload: 3.0.0\n@payloadcms/db-mongodb: 3.0.0\n@payloadcms/ui: 3.0.0')
  })

  it('returns empty string when payload missing', () => {
    expect(formatForClipboard({})).toBe('')
  })

  it('handles a payload-only map', () => {
    expect(formatForClipboard({ payload: '3.1.2' })).toBe('payload: 3.1.2')
  })
})
