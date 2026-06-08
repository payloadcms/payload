import { describe, expect, it } from 'vitest'

import { generateDataMigrationCode } from './generateDataMigrationCode.js'

describe('generateDataMigrationCode', () => {
  it('should generate migrateVersionsEnabled call for drafts_enabled', () => {
    const { downCode, upCode } = generateDataMigrationCode([
      {
        type: 'drafts_enabled',
        slug: 'posts',
        entity: 'collection',
        initialStatus: 'draft',
      },
    ])

    expect(upCode).toContain(`payload.db.migrateVersionsEnabled`)
    expect(upCode).toContain(`slug: 'posts'`)
    expect(upCode).toContain(`initialStatus: 'draft'`)
    expect(downCode).toContain(`payload.db.migrateVersionsDisabled`)
    expect(downCode).toContain(`slug: 'posts'`)
  })

  it('should generate migrateFieldLocalized call for field_localized', () => {
    const { downCode, upCode } = generateDataMigrationCode(
      [
        {
          type: 'field_localized',
          slug: 'posts',
          entity: 'collection',
          fieldPath: 'title',
        },
      ],
      { defaultLocale: 'en' },
    )

    expect(upCode).toContain(`payload.db.migrateFieldLocalized`)
    expect(upCode).toContain(`fieldPath: 'title'`)
    expect(upCode).toContain(`defaultLocale: 'en'`)
    expect(downCode).toContain(`payload.db.migrateFieldDelocalized`)
  })

  it('should return empty strings for no-op changes', () => {
    const { downCode, upCode } = generateDataMigrationCode([
      { type: 'versions_enabled', slug: 'posts', entity: 'collection' },
      { type: 'locale_added', locale: 'es' },
    ])
    expect(upCode).toBe('')
    expect(downCode).toBe('')
  })
})
