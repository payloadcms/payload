import { describe, expect, it } from 'vitest'

import { getLocalizedDraftStatus } from './getLocalizedDraftStatus.js'

describe('getLocalizedDraftStatus', () => {
  it('should preserve existing locale statuses and draft the requested locale', () => {
    expect(
      getLocalizedDraftStatus({
        existingStatus: {
          en: 'published',
          es: 'published',
        },
        locale: 'en',
        localeCodes: ['en', 'es'],
      }),
    ).toStrictEqual({
      en: 'draft',
      es: 'published',
    })
  })

  it('should draft all configured locales for locale all without adding an all key', () => {
    expect(
      getLocalizedDraftStatus({
        existingStatus: {
          en: 'published',
          es: 'published',
        },
        locale: 'all',
        localeCodes: ['en', 'es'],
      }),
    ).toStrictEqual({
      en: 'draft',
      es: 'draft',
    })
  })
})
