import { describe, expect, it } from 'vitest'

import { translations } from './exports/all.js'
import { importDateFNSLocale } from './importDateFNSLocale.js'

describe('importDateFNSLocale', () => {
  it('should resolve a date-fns locale for every language dateFNSKey', async () => {
    const keys = [...new Set(Object.values(translations).map((language) => language.dateFNSKey))]

    expect(keys.length).toBeGreaterThan(1)

    for (const key of keys) {
      const locale = await importDateFNSLocale(key)
      expect(locale, `missing date-fns locale for ${key}`).toBeDefined()
    }
  })
})
