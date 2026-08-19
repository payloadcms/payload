import { describe, expect, it } from 'vitest'

import { hierarchyCollectionBeforeChange } from './collectionBeforeChange.js'

describe('hierarchyCollectionBeforeChange', () => {
  const hook = hierarchyCollectionBeforeChange({ parentFieldName: 'parent' })

  it('should reject a self-referential parent on update', async () => {
    await expect(
      hook({
        collection: { hierarchy: { parentFieldName: 'parent' }, slug: 'folders' } as any,
        context: {},
        data: { id: '1', parent: '1' },
        operation: 'update',
        originalDoc: { id: '1', parent: null } as any,
        req: {} as any,
      }),
    ).rejects.toThrow(/cannot be its own parent/i)
  })

  it('should reject a self-referential parent during on-demand validation', async () => {
    await expect(
      hook({
        collection: { hierarchy: { parentFieldName: 'parent' }, slug: 'folders' } as any,
        context: {},
        data: { id: '1', parent: '1' },
        operation: 'validate',
        originalDoc: { id: '1', parent: null } as any,
        req: {} as any,
      }),
    ).rejects.toThrow(/cannot be its own parent/i)
  })

  it('should allow an unrelated parent change on create', async () => {
    await expect(
      hook({
        collection: { hierarchy: { parentFieldName: 'parent' }, slug: 'folders' } as any,
        context: {},
        data: { id: '1', parent: '2' },
        operation: 'create',
        originalDoc: undefined,
        req: {} as any,
      }),
    ).resolves.toEqual({ id: '1', parent: '2' })
  })
})
