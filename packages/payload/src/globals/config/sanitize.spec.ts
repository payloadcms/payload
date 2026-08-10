import type { GlobalConfig } from './types.js'

import { describe, expect, it } from 'vitest'

import { sanitizeGlobal } from './sanitize.js'

const minimalConfig = {
  collections: [],
  globals: [],
} as any

describe('sanitizeGlobal', () => {
  it('should populate sanitized global defaults for a minimal config', () => {
    const global: GlobalConfig = {
      slug: 'header',
      fields: [],
    }

    const result = sanitizeGlobal(minimalConfig, global)

    expect(result).toMatchObject({
      _sanitized: true,
      access: {
        read: expect.any(Function),
        update: expect.any(Function),
      },
      admin: {},
      custom: {},
      endpoints: expect.any(Array),
      fields: expect.any(Array),
      flattenedFields: expect.any(Array),
      hooks: {
        afterChange: [],
        afterRead: [],
        beforeChange: [],
        beforeOperation: [],
        beforeRead: [],
        beforeValidate: [],
      },
      label: 'Header',
      slug: 'header',
    })
    expect(result.access.readVersions).toBeUndefined()
    expect(result.admin.components).toBeUndefined()
    expect(result.graphQL).toBeUndefined()
    expect(result.lockDocuments).toBeUndefined()
    expect(result.typescript).toBeUndefined()
  })

  it('should populate a nested default when the property is explicitly undefined', () => {
    const global: GlobalConfig = {
      access: {
        read: undefined,
      },
      hooks: {
        beforeOperation: undefined,
      },
      slug: 'header',
      fields: [],
    }

    const result = sanitizeGlobal(minimalConfig, global)

    expect(result.access.read).toEqual(expect.any(Function))
    expect(result.hooks.beforeOperation).toEqual([])
  })

  it('should default versions to true when not specified', () => {
    const global: GlobalConfig = {
      slug: 'header',
      fields: [],
    }

    const result = sanitizeGlobal(minimalConfig, global)

    expect(result.versions).toEqual({ drafts: false, max: 100 })
  })

  it('should preserve explicit versions: false', () => {
    const global: GlobalConfig = {
      slug: 'header',
      fields: [],
      versions: false,
    }

    const result = sanitizeGlobal(minimalConfig, global)

    expect(result.versions).toBe(false)
  })

  it('should preserve explicit versions object config', () => {
    const global: GlobalConfig = {
      slug: 'header',
      fields: [],
      versions: { drafts: true, max: 50 },
    }

    const result = sanitizeGlobal(minimalConfig, global)

    expect((result.versions as any).max).toBe(50)
    expect((result.versions as any).drafts).toBeTruthy()
  })
})
