import { describe, expect, it, vi } from 'vitest'

import type { CollectionConfig } from '../collections/config/types.js'
import type { Config } from '../config/types.js'
import type { CollectionBeforeChangeHook } from '../collections/config/types.js'

import { NotFound } from '../errors/NotFound.js'
import { hierarchyCollectionBeforeChange } from './hooks/collectionBeforeChange.js'
import { sanitizeHierarchyCollection } from './sanitizeHierarchyCollection.js'

type HookArgs = Parameters<CollectionBeforeChangeHook>[0]

const hook = hierarchyCollectionBeforeChange({ parentFieldName: 'parent' })

function makeArgs({
  data = { parent: 'other' },
  findByID = vi.fn().mockResolvedValue({ id: 'other', parent: null }),
  operation = 'update',
  originalDoc = { id: 'current', parent: null },
  versions,
}: {
  data?: Record<string, unknown>
  findByID?: ReturnType<typeof vi.fn>
  operation?: HookArgs['operation']
  originalDoc?: Record<string, unknown>
  versions?: CollectionConfig['versions']
} = {}): HookArgs {
  return {
    collection: { slug: 'pages', hierarchy: { parentFieldName: 'parent' }, versions },
    data,
    operation,
    originalDoc,
    req: { payload: { findByID } },
  } as unknown as HookArgs
}

describe('hierarchy parent validation', () => {
  it.each([undefined, false])('should accept a single parent with hasMany %s', (hasMany) => {
    const collection: CollectionConfig = {
      slug: 'pages',
      fields: [
        { name: 'title', type: 'text' },
        { name: 'parent', type: 'relationship', relationTo: 'pages', hasMany },
      ],
      hierarchy: { parentFieldName: 'parent' },
    }

    expect(() => sanitizeHierarchyCollection(collection, {} as Config)).not.toThrow()
  })

  it('should reject a parent field with hasMany enabled', () => {
    const collection: CollectionConfig = {
      slug: 'pages',
      fields: [{ name: 'parent', type: 'relationship', relationTo: 'pages', hasMany: true }],
      hierarchy: { parentFieldName: 'parent' },
    }

    expect(() => sanitizeHierarchyCollection(collection, {} as Config)).toThrow('hasMany')
  })

  it('should reject a self parent when creating a custom ID', async () => {
    await expect(
      hook(
        makeArgs({
          data: { id: 'custom', parent: 'custom' },
          operation: 'create',
          originalDoc: {},
        }),
      ),
    ).rejects.toThrow('own parent')
  })

  it('should reject a create that closes a cycle through its custom ID', async () => {
    const findByID = vi.fn().mockResolvedValue({ id: 'other', parent: 'custom' })

    await expect(
      hook(
        makeArgs({
          data: { id: 'custom', parent: 'other' },
          findByID,
          operation: 'create',
          originalDoc: {},
        }),
      ),
    ).rejects.toThrow('own subfolder')
  })

  it('should validate zero-valued parent and document IDs', async () => {
    await expect(
      hook(makeArgs({ data: { id: 0, parent: 0 }, operation: 'create', originalDoc: {} })),
    ).rejects.toThrow('own parent')
  })

  it('should include hidden structural fields while walking ancestor links', async () => {
    const findByID = vi.fn().mockResolvedValue({ id: 'other', parent: null })

    await hook(makeArgs({ findByID }))

    expect(findByID).toHaveBeenCalledWith(
      expect.objectContaining({
        overrideAccess: true,
        showHiddenFields: true,
        select: { parent: true },
      }),
    )
  })

  it('should reject a descendant parent reached through an ancestor', async () => {
    const findByID = vi.fn().mockResolvedValue({ id: 'other', parent: 'current' })

    await expect(hook(makeArgs({ findByID }))).rejects.toThrow('own subfolder')
  })

  it('should reject an existing loop in an ancestor chain', async () => {
    const findByID = vi.fn().mockResolvedValue({ id: 'other', parent: 'other' })

    await expect(hook(makeArgs({ findByID }))).rejects.toThrow('Circular reference')
  })

  it('should propagate structural read failures', async () => {
    const findByID = vi.fn().mockRejectedValue(new Error('Database unavailable'))

    await expect(hook(makeArgs({ findByID }))).rejects.toThrow('Database unavailable')
  })

  it('should allow a missing ancestor without hiding other failures', async () => {
    const findByID = vi.fn().mockRejectedValue(new NotFound())
    const args = makeArgs({ findByID })

    await expect(hook(args)).resolves.toEqual(args.data)
  })

  it('should validate both published and latest parents when publishing an unchanged parent', async () => {
    const findByID = vi.fn().mockResolvedValue({ id: 'other', parent: null })

    await hook(
      makeArgs({
        data: { _status: 'published' },
        findByID,
        originalDoc: { id: 'current', parent: 'other' },
        versions: { drafts: true },
      }),
    )

    expect(findByID.mock.calls.map(([args]) => args.draft)).toEqual([false, true])
  })

  it.each([false, true])('should reject a published cycle in the draft=%s graph', async (draft) => {
    const findByID = vi.fn().mockImplementation(async (args) => ({
      id: 'other',
      parent: args.draft === draft ? 'current' : null,
    }))

    await expect(
      hook(
        makeArgs({
          data: { _status: 'published' },
          findByID,
          originalDoc: { id: 'current', parent: 'other' },
          versions: { drafts: true },
        }),
      ),
    ).rejects.toThrow('own subfolder')
  })

  it('should validate the latest graph without rejecting a draft-only move against the published graph', async () => {
    const findByID = vi.fn().mockResolvedValue({ id: 'other', parent: null })

    await hook(
      makeArgs({
        data: { _status: 'draft', parent: 'other' },
        findByID,
        versions: { drafts: true },
      }),
    )

    expect(findByID.mock.calls.map(([args]) => args.draft)).toEqual([true])
  })
})
