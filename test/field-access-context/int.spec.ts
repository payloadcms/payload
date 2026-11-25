import { createPayloadRequest } from 'payload'
import { expect, vi } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import {
  childrenSlug,
  globalSlug,
  parentsSlug,
  readAccessLog,
  readUpdateOperationLog,
  resetAccessLog,
  resetUpdateOperationLog,
} from './shared.js'

const childIDs: (number | string)[] = []
const parentIDs: (number | string)[] = []

test.suite('field access collection context', { config: './config.ts' }, () => {
  test.afterEach(async ({ payload }) => {
    for (const id of parentIDs) {
      await payload.delete({ id, collection: parentsSlug, overrideAccess: true })
    }
    parentIDs.length = 0

    for (const id of childIDs) {
      await payload.delete({ id, collection: childrenSlug, overrideAccess: true })
    }
    childIDs.length = 0

    resetAccessLog()
    resetUpdateOperationLog()
  })

  test('should pass collectionSlug to local create field access callbacks', async ({ payload }) => {
    const doc = await payload.create({
      collection: parentsSlug,
      data: {
        accessCreateProbe: 'local create',
        title: 'local create parent',
      },
      overrideAccess: false,
    })
    parentIDs.push(doc.id)

    const log = readAccessLog()
    expect(log).toContainEqual(
      expect.objectContaining({ collectionSlug: parentsSlug, fieldName: 'accessCreateProbe' }),
    )
    expect(
      log.filter((e) => e.fieldName === 'accessCreateProbe' && e.collectionSlug === undefined),
    ).toHaveLength(0)
  })

  test('should pass collectionSlug to REST create field access callbacks', async ({
    restClient,
  }) => {
    const response = await restClient.POST(`/${parentsSlug}`, {
      body: JSON.stringify({
        accessCreateProbe: 'rest create',
        title: 'rest create parent',
      }),
    })
    const doc = await response.json()
    parentIDs.push(doc.doc.id)

    expect(response.status).toBe(201)
    const log = readAccessLog()
    expect(log).toContainEqual(
      expect.objectContaining({ collectionSlug: parentsSlug, fieldName: 'accessCreateProbe' }),
    )
    expect(
      log.filter((e) => e.fieldName === 'accessCreateProbe' && e.collectionSlug === undefined),
    ).toHaveLength(0)
  })

  test('should pass collectionSlug to local read field access callbacks', async ({ payload }) => {
    const doc = await payload.create({
      collection: parentsSlug,
      data: {
        accessReadProbe: 'local read',
        title: 'local read parent',
      },
      overrideAccess: true,
    })
    parentIDs.push(doc.id)
    resetAccessLog()

    await payload.findByID({
      id: doc.id,
      collection: parentsSlug,
      overrideAccess: false,
    })

    const log = readAccessLog()
    expect(log).toContainEqual(
      expect.objectContaining({ collectionSlug: parentsSlug, fieldName: 'accessReadProbe' }),
    )
    expect(
      log.filter((e) => e.fieldName === 'accessReadProbe' && e.collectionSlug === undefined),
    ).toHaveLength(0)
  })

  test('should pass collectionSlug to REST read field access callbacks', async ({
    payload,
    restClient,
  }) => {
    const doc = await payload.create({
      collection: parentsSlug,
      data: {
        accessReadProbe: 'rest read',
        title: 'rest read parent',
      },
      overrideAccess: true,
    })
    parentIDs.push(doc.id)
    resetAccessLog()

    const response = await restClient.GET(`/${parentsSlug}/${doc.id}`)

    expect(response.status).toBe(200)
    const log = readAccessLog()
    expect(log).toContainEqual(
      expect.objectContaining({ collectionSlug: parentsSlug, fieldName: 'accessReadProbe' }),
    )
    expect(
      log.filter((e) => e.fieldName === 'accessReadProbe' && e.collectionSlug === undefined),
    ).toHaveLength(0)
  })

  test('should pass collectionSlug to GraphQL read field access callbacks', async ({
    payload,
    restClient,
  }) => {
    const doc = await payload.create({
      collection: parentsSlug,
      data: {
        accessReadProbe: 'graphql read',
        title: 'graphql read parent',
      },
      overrideAccess: true,
    })
    parentIDs.push(doc.id)
    resetAccessLog()

    const query = `query {
      FieldAccessContextParents(where: { title: { equals: "graphql read parent" } }, limit: 1) {
        docs {
          id
          accessReadProbe
        }
      }
    }`
    const response = await restClient.GRAPHQL_POST({
      body: JSON.stringify({ query }),
    })
    const result = await response.json()

    expect(result.errors).toBeUndefined()
    const log = readAccessLog()
    expect(log).toContainEqual(
      expect.objectContaining({ collectionSlug: parentsSlug, fieldName: 'accessReadProbe' }),
    )
    expect(
      log.filter((e) => e.fieldName === 'accessReadProbe' && e.collectionSlug === undefined),
    ).toHaveLength(0)
  })

  test('should pass child collectionSlug when reading populated relationship children', async ({
    payload,
  }) => {
    const child = await payload.create({
      collection: childrenSlug,
      data: {
        childReadProbe: 'relationship child read',
        title: 'relationship child',
      },
      overrideAccess: true,
    })
    childIDs.push(child.id)

    const parent = await payload.create({
      collection: parentsSlug,
      data: {
        child: child.id,
        title: 'relationship parent',
      },
      overrideAccess: true,
    })
    parentIDs.push(parent.id)
    resetAccessLog()

    await payload.findByID({
      id: parent.id,
      collection: parentsSlug,
      depth: 1,
      overrideAccess: false,
    })

    // Child field access should receive the child collection's slug, not the parent's
    const log = readAccessLog()
    expect(log).toContainEqual(
      expect.objectContaining({ collectionSlug: childrenSlug, fieldName: 'childReadProbe' }),
    )
    expect(
      log.filter((e) => e.fieldName === 'childReadProbe' && e.collectionSlug === undefined),
    ).toHaveLength(0)
  })

  test('should pass collectionSlug to update field access callbacks', async ({ payload }) => {
    const doc = await payload.create({
      collection: parentsSlug,
      data: {
        title: 'update parent',
      },
      overrideAccess: true,
    })
    parentIDs.push(doc.id)
    resetAccessLog()

    await payload.update({
      id: doc.id,
      collection: parentsSlug,
      data: {
        accessUpdateProbe: 'local update',
      },
      overrideAccess: false,
    })

    const log = readAccessLog()
    expect(log).toContainEqual(
      expect.objectContaining({ collectionSlug: parentsSlug, fieldName: 'accessUpdateProbe' }),
    )
    expect(
      log.filter((e) => e.fieldName === 'accessUpdateProbe' && e.collectionSlug === undefined),
    ).toHaveLength(0)
  })

  test('should preserve extra top-level data and configured field values', async ({ payload }) => {
    const doc = await payload.create({
      collection: parentsSlug,
      data: { title: 'original' },
      overrideAccess: true,
    })
    parentIDs.push(doc.id)
    const updateSpy = vi.spyOn(payload.db, 'updateOne')
    const metadata = { arbitrary: true, nested: { customValue: 1 } }

    try {
      const updated = await payload.update({
        collection: parentsSlug,
        id: doc.id,
        data: {
          title: 'changed',
          extra: true,
          nested: { note: 'allowed', extra: true },
          metadata,
        } as never,
        overrideAccess: false,
      })
      const writtenData = updateSpy.mock.calls[0]![0].data

      expect(writtenData).toHaveProperty('extra', true)
      expect(writtenData.nested).toMatchObject({ note: 'allowed', extra: true })
      expect(updated.metadata).toEqual(metadata)
      expect(updated.title).toBe('changed')
    } finally {
      updateSpy.mockRestore()
    }
  })

  test('should make configured virtual input available to hooks without persisting it', async ({
    payload,
  }) => {
    const doc = await payload.create({
      collection: parentsSlug,
      data: { title: 'original' },
      overrideAccess: true,
    })
    parentIDs.push(doc.id)
    await payload.update({
      collection: parentsSlug,
      id: doc.id,
      data: { saveInstruction: 'from virtual input' },
      overrideAccess: false,
    })
    const stored = await payload.db.findOne({
      collection: parentsSlug,
      where: { id: { equals: doc.id } },
    })

    expect(stored?.title).toBe('from virtual input')
    expect(stored).not.toHaveProperty('saveInstruction')
  })

  test.options.describe('MongoDB', { db: 'mongo' }, () => {
    test('should preserve raw operators in direct collection adapter updates', async ({
      payload,
    }) => {
      const doc = await payload.create({
        collection: parentsSlug,
        data: { title: 'original' },
        overrideAccess: true,
      })
      parentIDs.push(doc.id)

      for (const returning of [false, true]) {
        await payload.db.updateOne({
          collection: parentsSlug,
          data: { $inc: { count: 1 }, $unset: { title: 1 } },
          id: doc.id,
          returning,
        })
      }

      const updated = await payload.findByID({
        collection: parentsSlug,
        id: doc.id,
        overrideAccess: true,
      })

      expect(updated.count).toBe(2)
      expect(updated.title).toBeUndefined()
    })

    test('should preserve raw operators in direct global adapter updates', async ({ payload }) => {
      await payload.updateGlobal({
        slug: globalSlug,
        data: { globalReadProbe: 'original' },
        overrideAccess: true,
      })

      for (const returning of [false, true]) {
        await payload.db.updateGlobal({
          data: { $inc: { count: 1 }, $unset: { globalReadProbe: 1 } },
          returning,
          slug: globalSlug,
        })
      }

      const updated = await payload.findGlobal({ slug: globalSlug, overrideAccess: true })

      expect(updated.count).toBe(2)
      expect(updated.globalReadProbe).toBeUndefined()
    })
  })

  test('should strip unsupported collection update keys before persistence', async ({
    payload,
  }) => {
    const doc = await payload.create({
      collection: parentsSlug,
      data: { title: 'original' },
      overrideAccess: true,
    })
    parentIDs.push(doc.id)

    await payload.update({
      collection: parentsSlug,
      data: { title: 'ordinary' },
      id: doc.id,
      overrideAccess: false,
    })
    expect(readUpdateOperationLog()).toContain(parentsSlug)
    resetUpdateOperationLog()

    const updateSpy = vi.spyOn(payload.db, 'updateOne')

    try {
      for (const data of [
        { $extra: { title: 'ignored' } },
        { $unknownField: 'ignored', title: 'changed' },
      ]) {
        await payload.update({ collection: parentsSlug, data, id: doc.id, overrideAccess: false })
      }

      const updated = await payload.findByID({
        collection: parentsSlug,
        id: doc.id,
        overrideAccess: true,
      })

      expect(updated.title).toBe('changed')
      expect(readUpdateOperationLog()).toHaveLength(2)
      expect(updateSpy).toHaveBeenCalledTimes(2)
      for (const [args] of updateSpy.mock.calls) {
        expect(args.data).not.toHaveProperty('$extra')
        expect(args.data).not.toHaveProperty('$unknownField')
      }
    } finally {
      updateSpy.mockRestore()
    }
  })

  test('should strip unsupported bulk update keys before persistence', async ({ payload }) => {
    const doc = await payload.create({
      collection: parentsSlug,
      data: { title: 'original' },
      overrideAccess: true,
    })
    parentIDs.push(doc.id)

    await payload.update({
      collection: parentsSlug,
      data: { title: 'ordinary' },
      overrideAccess: false,
      where: { id: { equals: doc.id } },
    })
    expect(readUpdateOperationLog()).toContain(parentsSlug)
    resetUpdateOperationLog()

    const updateSpy = vi.spyOn(payload.db, 'updateOne')

    try {
      for (const data of [
        { $extra: { title: 'ignored' } },
        { $unknownField: 'ignored', title: 'changed' },
      ]) {
        await payload.update({
          collection: parentsSlug,
          data,
          overrideAccess: false,
          where: { id: { equals: doc.id } },
        })
      }

      const updated = await payload.findByID({
        collection: parentsSlug,
        id: doc.id,
        overrideAccess: true,
      })

      expect(updated.title).toBe('changed')
      expect(readUpdateOperationLog()).toHaveLength(2)
      expect(updateSpy).toHaveBeenCalledTimes(2)
      for (const [args] of updateSpy.mock.calls) {
        expect(args.data).not.toHaveProperty('$extra')
        expect(args.data).not.toHaveProperty('$unknownField')
      }
    } finally {
      updateSpy.mockRestore()
    }
  })

  test('should strip unsupported global update keys before persistence', async ({ payload }) => {
    await payload.updateGlobal({
      data: { globalReadProbe: 'original' },
      overrideAccess: true,
      slug: globalSlug,
    })

    await payload.updateGlobal({
      data: { globalReadProbe: 'ordinary' },
      overrideAccess: false,
      slug: globalSlug,
    })
    expect(readUpdateOperationLog()).toContain(globalSlug)
    resetUpdateOperationLog()

    const updateSpy = vi.spyOn(payload.db, 'updateGlobal')

    try {
      for (const data of [
        { $extra: { globalReadProbe: 'ignored' } },
        { $unknownField: 'ignored', globalReadProbe: 'changed' },
      ]) {
        await payload.updateGlobal({ data, overrideAccess: false, slug: globalSlug })
      }

      const updated = await payload.findGlobal({ overrideAccess: true, slug: globalSlug })

      expect(updated.globalReadProbe).toBe('changed')
      expect(readUpdateOperationLog()).toHaveLength(2)
      expect(updateSpy).toHaveBeenCalledTimes(2)
      for (const [args] of updateSpy.mock.calls) {
        expect(args.data).not.toHaveProperty('$extra')
        expect(args.data).not.toHaveProperty('$unknownField')
      }
    } finally {
      updateSpy.mockRestore()
    }
  })

  test('should pass collectionSlug to findDistinct field access callbacks', async ({ payload }) => {
    const firstDoc = await payload.create({
      collection: parentsSlug,
      data: {
        distinctProbe: 'one',
        title: 'distinct one',
      },
      overrideAccess: true,
    })
    parentIDs.push(firstDoc.id)

    const secondDoc = await payload.create({
      collection: parentsSlug,
      data: {
        distinctProbe: 'two',
        title: 'distinct two',
      },
      overrideAccess: true,
    })
    parentIDs.push(secondDoc.id)
    resetAccessLog()

    await payload.findDistinct({
      collection: parentsSlug,
      field: 'distinctProbe',
      overrideAccess: false,
    })

    const log = readAccessLog()
    expect(log).toContainEqual(
      expect.objectContaining({ collectionSlug: parentsSlug, fieldName: 'distinctProbe' }),
    )
    expect(
      log.filter((e) => e.fieldName === 'distinctProbe' && e.collectionSlug === undefined),
    ).toHaveLength(0)
  })

  test('should pass collectionSlug when building collection field permissions', async ({
    payload,
  }) => {
    // payload.auth() calls getEntityPermissions for all registered collections,
    // which calls populateFieldPermissions → field.access[operation] for each field.
    const req = await createPayloadRequest({ payload })

    await payload.auth({
      headers: new Headers(),
      req,
    })

    const log = readAccessLog()
    expect(log).toContainEqual(
      expect.objectContaining({ collectionSlug: parentsSlug, fieldName: 'permissionsProbe' }),
    )
    expect(
      log.filter((e) => e.fieldName === 'permissionsProbe' && e.collectionSlug === undefined),
    ).toHaveLength(0)
  })

  test('should leave collectionSlug undefined and set globalSlug for global field access callbacks', async ({
    payload,
  }) => {
    await payload.updateGlobal({
      slug: globalSlug,
      data: {
        globalReadProbe: 'global read',
      },
      overrideAccess: true,
    })
    resetAccessLog()

    await payload.findGlobal({
      slug: globalSlug,
      overrideAccess: false,
    })

    const log = readAccessLog()
    expect(log).toContainEqual(
      expect.objectContaining({
        collectionSlug: undefined,
        fieldName: 'globalReadProbe',
        globalSlug,
        operation: 'read',
        source: 'field-access',
      }),
    )
    expect(
      log.filter((e) => e.fieldName === 'globalReadProbe' && e.collectionSlug !== undefined),
    ).toHaveLength(0)
    expect(
      log.filter((e) => e.fieldName === 'globalReadProbe' && e.globalSlug === undefined),
    ).toHaveLength(0)
  })

  test('should pass child collectionSlug when reading a populated relationship child from a global', async ({
    payload,
  }) => {
    const child = await payload.create({
      collection: childrenSlug,
      data: {
        childReadProbe: 'global relationship child',
        title: 'global relationship child',
      },
      overrideAccess: true,
    })
    childIDs.push(child.id)

    await payload.updateGlobal({
      slug: globalSlug,
      data: {
        globalChild: child.id,
      },
      overrideAccess: true,
    })
    resetAccessLog()

    await payload.findGlobal({
      slug: globalSlug,
      depth: 1,
      overrideAccess: false,
    })

    // The child's field access should receive the child collection context, not the global context
    const log = readAccessLog()
    expect(log).toContainEqual(
      expect.objectContaining({
        collectionSlug: childrenSlug,
        fieldName: 'childReadProbe',
        globalSlug: undefined,
      }),
    )
    expect(
      log.filter((e) => e.fieldName === 'childReadProbe' && e.collectionSlug === undefined),
    ).toHaveLength(0)
    expect(
      log.filter((e) => e.fieldName === 'childReadProbe' && e.globalSlug !== undefined),
    ).toHaveLength(0)
  })
})
