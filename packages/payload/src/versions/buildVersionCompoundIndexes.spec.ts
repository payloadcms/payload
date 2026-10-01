import type { Config } from '../config/types.js'

import { describe, expect, it } from 'vitest'

import { sanitizeConfig } from '../config/sanitize.js'
import { buildVersionCompoundIndexes } from './buildVersionCompoundIndexes.js'

describe('buildVersionCompoundIndexes', () => {
  it('should keep the branch discriminator at the version-row level', () => {
    const config = sanitizeConfig({
      branching: true,
      collections: [
        {
          slug: 'articles',
          fields: [{ name: 'slug', type: 'text', localized: true, unique: true }],
          versions: { drafts: true },
        },
      ],
      localization: {
        defaultLocale: 'en',
        locales: ['en', 'de'],
      },
    } as Config)
    const slugIndex = config.collections[0].sanitizedIndexes.find((index) =>
      index.fields.some((field) => field.path === 'slug'),
    )

    expect(slugIndex).toBeDefined()

    const [versionIndex] = buildVersionCompoundIndexes({ indexes: [slugIndex!] })

    expect(versionIndex.fields.map((field) => field.path)).toEqual(['version.slug', '_branch'])
    expect(versionIndex.fields.map((field) => field.localizedPath)).toEqual([
      'version.slug.<locale>',
      '_branch',
    ])
  })
})
