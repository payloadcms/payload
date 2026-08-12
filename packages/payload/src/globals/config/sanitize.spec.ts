import type { GlobalConfig } from './types.js'
import type { PayloadRequest } from '../../types/index.js'

import { describe, expect, it } from 'vitest'

import { sanitizeGlobal } from './sanitize.js'

const minimalConfig = {
  collections: [],
  globals: [],
} as any

const req = {} as PayloadRequest

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
        readVersions: expect.any(Function),
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

  it('should preserve an explicit readVersions access function', () => {
    const readVersions = () => true
    const result = sanitizeGlobal(minimalConfig, {
      slug: 'header',
      fields: [],
      access: { read: () => false, readVersions },
    })

    expect(result.access.readVersions).toBe(readVersions)
  })

  it.each([true, false])(
    'should pass through a %s result from read access to readVersions',
    async (readResult) => {
      const result = sanitizeGlobal(minimalConfig, {
        slug: 'header',
        fields: [],
        access: { read: async () => readResult },
      })

      await expect(result.access.readVersions({ req })).resolves.toBe(readResult)
    },
  )

  it('should translate inherited read queries to global version fields', async () => {
    const result = sanitizeGlobal(minimalConfig, {
      slug: 'header',
      fields: [],
      access: {
        read: async () => ({
          or: [{ title: { equals: 'Header' } }, { visible: { equals: true } }],
        }),
      },
    })

    await expect(result.access.readVersions({ req })).resolves.toEqual({
      or: [{ 'version.title': { equals: 'Header' } }, { 'version.visible': { equals: true } }],
    })
  })
})
