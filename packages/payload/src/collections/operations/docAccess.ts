import { z } from 'zod'

import type { SanitizedCollectionPermission } from '../../auth/index.js'
import type { Payload } from '../../index.js'
import type { AllOperations, JsonObject, PayloadRequest } from '../../types/index.js'
import type { Collection } from '../config/types.js'

import { APIError } from '../../errors/APIError.js'
import { defineOperation } from '../../operations/defineOperation.js'
import { getEntityPermissions } from '../../utilities/getEntityPermissions/getEntityPermissions.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { sanitizePermissions } from '../../utilities/sanitizePermissions.js'

const allOperations: AllOperations[] = ['create', 'read', 'update', 'delete']

type DocumentAccessArgs = {
  collection: Collection
  /**
   * If the document data is passed, it will be used to check access instead of fetching the document from the database.
   */
  data?: JsonObject
  /**
   * When called for creating a new document, id is not provided.
   */
  id?: number | string
  req: PayloadRequest
}

async function getDocumentAccess(args: DocumentAccessArgs): Promise<SanitizedCollectionPermission> {
  const {
    id,
    collection: { config },
    data,
    req,
  } = args

  const collectionOperations = [...allOperations]

  if (
    config.auth &&
    typeof config.auth.maxLoginAttempts !== 'undefined' &&
    config.auth.maxLoginAttempts !== 0
  ) {
    collectionOperations.push('unlock')
  }

  if (config.versions) {
    collectionOperations.push('readVersions')
  }

  try {
    const result = await getEntityPermissions({
      id: id!,
      blockReferencesPermissions: {},
      data,
      entity: config,
      entityType: 'collection',
      fetchData: id ? true : (false as true),
      operations: collectionOperations,
      req,
    })

    const sanitizedPermissions = sanitizePermissions({
      collections: {
        [config.slug]: result,
      },
    })

    const collectionPermissions = sanitizedPermissions?.collections?.[config.slug]
    return collectionPermissions ?? { fields: {} }
  } catch (e: unknown) {
    await killTransaction(req)
    throw e
  }
}

const docAccessSchema = z.looseObject({
  id: z.union([z.string(), z.number()]).optional(),
  collection: z.string().describe('The collection slug'),
  data: z.record(z.string(), z.unknown()).optional(),
  req: z.unknown(),
})

export const docAccess = defineOperation({
  action: 'docAccess',
  expose: {
    rest: [
      {
        method: 'post',
        path: '/access/:id?',
      },
    ],
  },
  handler: async (
    payload: Payload,
    input: {
      collection: string
      data?: Record<string, unknown>
      id?: number | string
      req: PayloadRequest
    },
  ) => {
    const collection = payload.collections[input.collection]

    if (!collection) {
      throw new APIError(`Collection with the slug ${input.collection} was not found`, 404)
    }

    return getDocumentAccess({
      id: input.id,
      collection,
      data: input.data,
      req: input.req,
    })
  },
  input: docAccessSchema,
  target: 'collection',
})
