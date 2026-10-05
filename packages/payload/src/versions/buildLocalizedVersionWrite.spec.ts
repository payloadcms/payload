import type { SanitizedConfig } from '../config/types.js'
import type { Field } from '../fields/config/types.js'

import { describe, expect, it } from 'vitest'

import { buildLocalizedVersionWrite } from './buildLocalizedVersionWrite.js'

describe('buildLocalizedVersionWrite', () => {
  const fields: Field[] = [
    { name: 'title', type: 'text', localized: true },
    { name: 'summary', type: 'text' },
    { name: '_status', type: 'text', localized: true },
  ]

  it('should retain pending locale and shared content outside the main write', () => {
    const currentDoc = {
      title: { en: 'Live English', fr: 'Live French' },
      summary: 'Live summary',
      _status: { en: 'published', fr: 'published' },
    }
    const result = {
      title: { en: 'Edited English', fr: 'Edited French' },
      summary: 'Pending summary',
      _status: { en: 'draft', fr: 'published' },
    }
    const write = buildLocalizedVersionWrite({
      config: { blocks: [] } as unknown as SanitizedConfig,
      currentDoc,
      fields,
      result,
      targetsByLocale: { en: 'draft', fr: 'published' },
    })

    expect(write.mainData).toEqual({
      title: { en: 'Live English', fr: 'Edited French' },
      summary: 'Live summary',
      _status: { en: 'published', fr: 'published' },
    })
    expect(write.versionData).toEqual(result)
    expect(write.hasDraftLocales).toBe(true)
    expect(currentDoc.title.fr).toBe('Live French')
  })

  it('should omit the main write when every locale targets a draft', () => {
    const write = buildLocalizedVersionWrite({
      config: { blocks: [] } as unknown as SanitizedConfig,
      currentDoc: null,
      fields,
      result: { title: { en: 'Pending' }, _status: { en: 'draft', fr: 'draft' } },
      targetsByLocale: { en: 'draft', fr: 'draft' },
    })

    expect(write.mainData).toBeNull()
    expect(write.hasDraftLocales).toBe(true)
  })
})
