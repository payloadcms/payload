import { describe, expect, it } from 'vitest'

import { mergeLocalizedStatus } from './mergeLocalizedStatus.js'

describe('mergeLocalizedStatus', () => {
  it('should update only the provided locales', () => {
    expect(
      mergeLocalizedStatus({
        existingStatus: {
          en: 'published',
          es: 'published',
          xx: 'published',
        },
        localeCodes: ['en', 'es'],
        status: 'draft',
      }),
    ).toStrictEqual({
      en: 'draft',
      es: 'draft',
      xx: 'published',
    })
  })

  it('should update a single locale', () => {
    expect(
      mergeLocalizedStatus({
        existingStatus: {
          en: 'published',
          es: 'published',
        },
        localeCodes: ['es'],
        status: 'draft',
      }),
    ).toStrictEqual({
      en: 'published',
      es: 'draft',
    })
  })

  it('should create a localized status map when no existing status is available', () => {
    expect(
      mergeLocalizedStatus({
        existingStatus: undefined,
        localeCodes: ['en', 'es'],
        status: 'published',
      }),
    ).toStrictEqual({
      en: 'published',
      es: 'published',
    })
  })
})
