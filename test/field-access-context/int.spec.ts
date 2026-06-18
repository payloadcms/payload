import type { Payload } from 'payload'

import path from 'path'
import { createLocalReq } from 'payload'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { childrenSlug, globalSlug, parentsSlug, readAccessLog, resetAccessLog } from './shared.js'

let payload: Payload
let restClient: NextRESTClient

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const childIDs: (number | string)[] = []
const parentIDs: (number | string)[] = []

describe('field access collection context', () => {
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname))
  })

  afterEach(async () => {
    for (const id of parentIDs) {
      await payload.delete({ id, collection: parentsSlug })
    }
    parentIDs.length = 0

    for (const id of childIDs) {
      await payload.delete({ id, collection: childrenSlug })
    }
    childIDs.length = 0

    resetAccessLog()
  })

  afterAll(async () => {
    await payload.destroy()
  })

  it('should pass collectionSlug to local create field access callbacks', async () => {
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

  it('should pass collectionSlug to REST create field access callbacks', async () => {
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

  it('should pass collectionSlug to local read field access callbacks', async () => {
    const doc = await payload.create({
      collection: parentsSlug,
      data: {
        accessReadProbe: 'local read',
        title: 'local read parent',
      },
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

  it('should pass collectionSlug to REST read field access callbacks', async () => {
    const doc = await payload.create({
      collection: parentsSlug,
      data: {
        accessReadProbe: 'rest read',
        title: 'rest read parent',
      },
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

  it('should pass collectionSlug to GraphQL read field access callbacks', async () => {
    const doc = await payload.create({
      collection: parentsSlug,
      data: {
        accessReadProbe: 'graphql read',
        title: 'graphql read parent',
      },
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

  it('should pass child collectionSlug when reading populated relationship children', async () => {
    const child = await payload.create({
      collection: childrenSlug,
      data: {
        childReadProbe: 'relationship child read',
        title: 'relationship child',
      },
    })
    childIDs.push(child.id)

    const parent = await payload.create({
      collection: parentsSlug,
      data: {
        child: child.id,
        title: 'relationship parent',
      },
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

  it('should pass collectionSlug to update field access callbacks', async () => {
    const doc = await payload.create({
      collection: parentsSlug,
      data: {
        title: 'update parent',
      },
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

  it('should pass collectionSlug to findDistinct field access callbacks', async () => {
    const firstDoc = await payload.create({
      collection: parentsSlug,
      data: {
        distinctProbe: 'one',
        title: 'distinct one',
      },
    })
    parentIDs.push(firstDoc.id)

    const secondDoc = await payload.create({
      collection: parentsSlug,
      data: {
        distinctProbe: 'two',
        title: 'distinct two',
      },
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

  it('should pass collectionSlug when building collection field permissions', async () => {
    // payload.auth() calls getEntityPermissions for all registered collections,
    // which calls populateFieldPermissions → field.access[operation] for each field.
    const req = await createLocalReq({}, payload)

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

  it('should leave collectionSlug undefined and set globalSlug for global field access callbacks', async () => {
    await payload.updateGlobal({
      slug: globalSlug,
      data: {
        globalReadProbe: 'global read',
      },
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
})
