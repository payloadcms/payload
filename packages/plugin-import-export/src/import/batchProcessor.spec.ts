import { describe, expect, it } from 'vitest'

import { extractMultiLocaleData, resolveImportWriteAction } from './batchProcessor.js'

describe('localized import publication actions', () => {
  it('resolves each locale from its own localized status', () => {
    const { flatData, localeUpdates } = extractMultiLocaleData({
      configuredLocales: ['en', 'es'],
      data: {
        _status: {
          en: 'published',
          es: 'draft',
        },
        localized: {
          en: 'Published English',
          es: 'Draft Spanish',
        },
      },
      defaultLocale: 'en',
    })

    expect(flatData._status).toBe('published')
    expect(localeUpdates.es?._status).toBe('draft')
    expect(
      resolveImportWriteAction({ collectionHasVersions: true, status: flatData._status }),
    ).toBe('publish')
    expect(
      resolveImportWriteAction({
        collectionHasVersions: true,
        status: localeUpdates.es?._status,
      }),
    ).toBe('saveDraft')
  })

  it('does not collapse a localized status object into a single publish action', () => {
    expect(
      resolveImportWriteAction({
        collectionHasVersions: true,
        status: { en: 'published', es: 'draft' },
      }),
    ).toBeUndefined()
  })
})
