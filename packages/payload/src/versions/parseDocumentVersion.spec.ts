import { describe, expect, it } from 'vitest'

import { parseDocumentVersion } from './parseDocumentVersion.js'

describe('parseDocumentVersion', () => {
  it.each(['published', 'draft', 'latest'] as const)(
    'should accept %s for reads and updates',
    (version) => {
      expect(parseDocumentVersion({ params: { version } })).toBe(version)
    },
  )

  it('should preserve an omitted selector so operations can apply their defaults', () => {
    expect(parseDocumentVersion({ params: {} })).toBeUndefined()
    expect(parseDocumentVersion({ isCreate: true, params: {} })).toBeUndefined()
  })

  it('should reject latest on create', () => {
    expect(() => parseDocumentVersion({ isCreate: true, params: { version: 'latest' } })).toThrow(
      'Invalid version',
    )
  })

  it.each([true, false, '', null, ['draft'], { equals: 'draft' }, 'invalid'])(
    'should reject an invalid selector %j',
    (version) => {
      expect(() => parseDocumentVersion({ params: { version } })).toThrow('Invalid version')
    },
  )

  it.each(['draft', 'publishAllLocales', 'unpublishAllLocales'])(
    'should reject retired parameter %s even when false',
    (key) => {
      expect(() => parseDocumentVersion({ params: { [key]: false } })).toThrow('has been removed')
    },
  )
})
