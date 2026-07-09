import type { GlobalConfig } from './types.js'

import { describe, expect, it } from 'vitest'

import { sanitizeGlobal } from './sanitize.js'

const minimalConfig = {
  collections: [],
  globals: [],
} as any

describe('sanitizeGlobal — versions default', () => {
  it('should default versions to true when not specified', async () => {
    const global: GlobalConfig = {
      slug: 'header',
      fields: [],
    }

    const result = await sanitizeGlobal(minimalConfig, global)

    expect(result.versions).toEqual({ drafts: false, max: 100 })
  })

  it('should preserve explicit versions: false', async () => {
    const global: GlobalConfig = {
      slug: 'header',
      fields: [],
      versions: false,
    }

    const result = await sanitizeGlobal(minimalConfig, global)

    expect(result.versions).toBe(false)
  })

  it('should preserve explicit versions object config', async () => {
    const global: GlobalConfig = {
      slug: 'header',
      fields: [],
      versions: { drafts: true, max: 50 },
    }

    const result = await sanitizeGlobal(minimalConfig, global)

    expect((result.versions as any).max).toBe(50)
    expect((result.versions as any).drafts).toBeTruthy()
  })
})
