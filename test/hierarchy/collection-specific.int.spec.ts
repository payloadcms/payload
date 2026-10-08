/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test"] }] -- Tests use the shared fixture wrapper. */
import { expect, vi } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { foldersSlug, folderTagDocumentsSlug, organizationsSlug, productsSlug } from './shared.js'

test.suite('Collection-specific hierarchy scope inheritance', { config: './config.ts' }, () => {
  test('should reject a child whose allowed types are broader than its parent', async ({
    payload,
  }) => {
    const parent = await payload.create({
      collection: foldersSlug,
      data: { name: 'Restricted parent', allowedTypes: [organizationsSlug] },
      overrideAccess: true,
    })

    await expect(
      payload.create({
        collection: foldersSlug,
        data: {
          name: 'Broader child',
          allowedTypes: [organizationsSlug, productsSlug],
          parentFolder: parent.id,
        },
        overrideAccess: true,
      }),
    ).rejects.toThrow('cannot allow collection types that its parent does not allow')
  })

  test('should reject widening an existing child beyond its parent scope', async ({ payload }) => {
    const parent = await payload.create({
      collection: foldersSlug,
      data: { name: 'Widening parent', allowedTypes: [organizationsSlug] },
      overrideAccess: true,
    })

    const child = await payload.create({
      collection: foldersSlug,
      data: {
        name: 'Widening child',
        allowedTypes: [organizationsSlug],
        parentFolder: parent.id,
      },
      overrideAccess: true,
    })

    await expect(
      payload.update({
        id: child.id,
        collection: foldersSlug,
        data: { allowedTypes: [organizationsSlug, productsSlug] },
        overrideAccess: true,
      }),
    ).rejects.toThrow('cannot allow collection types that its parent does not allow')
  })

  test('should reject moving a broader folder beneath a narrower parent', async ({ payload }) => {
    const parent = await payload.create({
      collection: foldersSlug,
      data: { name: 'Move parent', allowedTypes: [organizationsSlug] },
      overrideAccess: true,
    })

    const child = await payload.create({
      collection: foldersSlug,
      data: {
        name: 'Moved child',
        allowedTypes: [organizationsSlug, productsSlug],
      },
      overrideAccess: true,
    })

    await expect(
      payload.update({
        id: child.id,
        collection: foldersSlug,
        data: { parentFolder: parent.id },
        overrideAccess: true,
      }),
    ).rejects.toThrow('cannot allow collection types that its parent does not allow')
  })

  test('should reject an unrestricted child beneath a restricted parent', async ({ payload }) => {
    const parent = await payload.create({
      collection: foldersSlug,
      data: { name: 'Restricted parent', allowedTypes: [organizationsSlug] },
      overrideAccess: true,
    })

    await expect(
      payload.create({
        collection: foldersSlug,
        data: { name: 'Unrestricted child', parentFolder: parent.id },
        overrideAccess: true,
      }),
    ).rejects.toSatisfy((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error)

      return message.includes('must have folder-type set') && !message.includes(parent.name)
    })
  })

  test('should skip parent scope validation when hierarchy fields are unchanged', async ({
    payload,
  }) => {
    const parent = await payload.create({
      collection: foldersSlug,
      data: { name: 'Unchanged parent', allowedTypes: [organizationsSlug] },
      overrideAccess: true,
    })

    const child = await payload.create({
      collection: foldersSlug,
      data: {
        name: 'Unchanged child',
        allowedTypes: [organizationsSlug],
        parentFolder: parent.id,
      },
      overrideAccess: true,
    })

    const findByID = vi.spyOn(payload, 'findByID')

    try {
      await payload.update({
        id: child.id,
        collection: foldersSlug,
        data: {
          name: 'Renamed child',
          allowedTypes: [organizationsSlug],
          parentFolder: parent.id,
        },
        overrideAccess: true,
      })

      const parentScopeReads = findByID.mock.calls.filter(
        ([args]) => args.collection === foldersSlug && args.id === parent.id,
      )

      expect(parentScopeReads).toHaveLength(0)
    } finally {
      findByID.mockRestore()
    }
  })

  test('should allow a child whose allowed types are a subset of its parent', async ({
    payload,
  }) => {
    const parent = await payload.create({
      collection: foldersSlug,
      data: {
        name: 'Broad parent',
        allowedTypes: [organizationsSlug, productsSlug],
      },
      overrideAccess: true,
    })

    const child = await payload.create({
      collection: foldersSlug,
      data: {
        name: 'Narrow child',
        allowedTypes: [organizationsSlug],
        parentFolder: parent.id,
      },
      overrideAccess: true,
    })

    const childWithEqualScope = await payload.create({
      collection: foldersSlug,
      data: {
        name: 'Equal child',
        allowedTypes: [organizationsSlug, productsSlug],
        parentFolder: parent.id,
      },
      overrideAccess: true,
    })

    expect(child.allowedTypes).toEqual([organizationsSlug])
    expect(childWithEqualScope.allowedTypes).toEqual([organizationsSlug, productsSlug])
  })

  test('should allow any child scope beneath an unrestricted parent', async ({ payload }) => {
    const parent = await payload.create({
      collection: foldersSlug,
      data: { name: 'Unrestricted parent' },
      overrideAccess: true,
    })

    const child = await payload.create({
      collection: foldersSlug,
      data: {
        name: 'Restricted child',
        allowedTypes: [organizationsSlug, productsSlug],
        parentFolder: parent.id,
      },
      overrideAccess: true,
    })

    expect(child.allowedTypes).toEqual([organizationsSlug, productsSlug])
  })

  test('should allow an unrestricted child beneath a parent that allows every collection type', async ({
    payload,
  }) => {
    const parent = await payload.create({
      collection: foldersSlug,
      data: {
        name: 'All-types parent',
        allowedTypes: [folderTagDocumentsSlug, organizationsSlug, productsSlug],
      },
      overrideAccess: true,
    })

    const child = await payload.create({
      collection: foldersSlug,
      data: { name: 'Unrestricted child', parentFolder: parent.id },
      overrideAccess: true,
    })

    expect(child.parentFolder).toMatchObject({ id: parent.id })
    expect(child.allowedTypes).toEqual([])
  })

  test('should reject narrowing an all-types parent that contains an unrestricted child', async ({
    payload,
  }) => {
    const parent = await payload.create({
      collection: foldersSlug,
      data: {
        name: 'All-types parent',
        allowedTypes: [folderTagDocumentsSlug, organizationsSlug, productsSlug],
      },
      overrideAccess: true,
    })

    await payload.create({
      collection: foldersSlug,
      data: { name: 'Unrestricted child', parentFolder: parent.id },
      overrideAccess: true,
    })

    await expect(
      payload.update({
        id: parent.id,
        collection: foldersSlug,
        data: { allowedTypes: [organizationsSlug, productsSlug] },
        overrideAccess: true,
      }),
    ).rejects.toThrow('contains folders that still belong to the following collections')
  })

  test('should reject restricting an unrestricted folder that contains a disallowed document type', async ({
    payload,
  }) => {
    const parent = await payload.create({
      collection: foldersSlug,
      data: { name: 'Unrestricted parent' },
      overrideAccess: true,
    })

    await payload.create({
      collection: productsSlug,
      data: { name: 'Product in unrestricted parent', parentFolder: parent.id },
      overrideAccess: true,
    })

    await expect(
      payload.update({
        id: parent.id,
        collection: foldersSlug,
        data: { allowedTypes: [organizationsSlug] },
        overrideAccess: true,
      }),
    ).rejects.toThrow('contains documents that still belong to the following collections')
  })

  test('should allow a folder moved to root to become unrestricted', async ({ payload }) => {
    const parent = await payload.create({
      collection: foldersSlug,
      data: { name: 'Previous parent', allowedTypes: [organizationsSlug] },
      overrideAccess: true,
    })

    const child = await payload.create({
      collection: foldersSlug,
      data: {
        name: 'Root child',
        allowedTypes: [organizationsSlug],
        parentFolder: parent.id,
      },
      overrideAccess: true,
    })

    const updatedChild = await payload.update({
      id: child.id,
      collection: foldersSlug,
      data: { allowedTypes: [], parentFolder: null },
      overrideAccess: true,
    })

    expect(updatedChild.allowedTypes).toEqual([])
    expect(updatedChild.parentFolder).toBeNull()
  })

  test('should allow an empty hasMany hierarchy selection', async ({ payload }) => {
    const document = await payload.create({
      collection: folderTagDocumentsSlug,
      data: { parentFolder: [], title: 'Untagged document' },
      overrideAccess: true,
    })

    expect(document.parentFolder).toEqual([])
  })

  test('should validate newly added values in a hasMany hierarchy selection', async ({
    payload,
  }) => {
    const firstFolder = await payload.create({
      collection: foldersSlug,
      data: { name: 'First allowed folder', allowedTypes: [folderTagDocumentsSlug] },
      overrideAccess: true,
    })

    const secondFolder = await payload.create({
      collection: foldersSlug,
      data: { name: 'Second allowed folder', allowedTypes: [folderTagDocumentsSlug] },
      overrideAccess: true,
    })

    const document = await payload.create({
      collection: folderTagDocumentsSlug,
      data: { parentFolder: [firstFolder.id], title: 'Tagged document' },
      overrideAccess: true,
    })

    const updatedDocument = await payload.update({
      id: document.id,
      collection: folderTagDocumentsSlug,
      data: { parentFolder: [firstFolder.id, secondFolder.id] },
      overrideAccess: true,
    })

    expect(updatedDocument.parentFolder).toHaveLength(2)
  })

  test('should reject a later incompatible value in a hasMany hierarchy selection', async ({
    payload,
  }) => {
    const allowedFolder = await payload.create({
      collection: foldersSlug,
      data: { name: 'Allowed folder', allowedTypes: [folderTagDocumentsSlug] },
      overrideAccess: true,
    })

    const incompatibleFolder = await payload.create({
      collection: foldersSlug,
      data: { name: 'Incompatible folder', allowedTypes: [organizationsSlug] },
      overrideAccess: true,
    })

    await expect(
      payload.create({
        collection: folderTagDocumentsSlug,
        data: {
          parentFolder: [allowedFolder.id, incompatibleFolder.id],
          title: 'Invalid tagged document',
        },
        overrideAccess: true,
      }),
    ).rejects.toMatchObject({
      data: {
        errors: [
          {
            message: `Hierarchy item "${incompatibleFolder.id}" does not allow documents of type "${folderTagDocumentsSlug}"`,
            path: 'parentFolder',
          },
        ],
      },
    })
  })
})
