import { describe, expect, it } from 'vitest'

describe('@payloadcms/next/views/diff exports', () => {
  it('exposes all expected named exports', async () => {
    const mod: Record<string, unknown> = await import('@payloadcms/next/views/diff')

    const expected = [
      'RenderDiff',
      'buildVersionFields',
      'RenderVersionFieldsToDiff',
      'DiffCollapser',
      'diffComponents',
      'defaultDiffComponents',
      'countChangedFields',
      'countChangedFieldsInRows',
      'fieldHasChanges',
      'getFieldsForRowComparison',
    ]

    for (const name of expected) {
      expect(mod[name], `Missing export: ${name}`).toBeDefined()
    }
  })
})
