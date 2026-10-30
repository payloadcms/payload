import { describe, expect, it } from 'vitest'

import { normalizeLocalizedStatus } from './normalizeLocalizedStatus.js'

describe('normalizeLocalizedStatus', () => {
  it('should preserve existing statuses during authorized all-locale publication', () => {
    expect(
      normalizeLocalizedStatus({
        existingStatus: {
          en: 'published',
          es: 'draft',
          xx: 'published',
        },
        hasAuthorizedPublicationStatus: true,
        locale: 'all',
        localeCodes: ['en', 'es', 'xx'],
        status: 'draft',
      }),
    ).toStrictEqual({
      en: 'published',
      es: 'draft',
      xx: 'published',
    })
  })

  it('should update all configured locales during ordinary all-locale normalization', () => {
    expect(
      normalizeLocalizedStatus({
        existingStatus: {
          en: 'published',
          es: 'published',
        },
        hasAuthorizedPublicationStatus: false,
        locale: 'all',
        localeCodes: ['en', 'es'],
        status: 'draft',
      }),
    ).toStrictEqual({
      en: 'draft',
      es: 'draft',
    })
  })

  it('should update only the requested locale during single-locale normalization', () => {
    expect(
      normalizeLocalizedStatus({
        existingStatus: {
          en: 'published',
          es: 'published',
        },
        hasAuthorizedPublicationStatus: false,
        locale: 'es',
        localeCodes: ['en', 'es'],
        status: 'draft',
      }),
    ).toStrictEqual({
      en: 'published',
      es: 'draft',
    })
  })
})
