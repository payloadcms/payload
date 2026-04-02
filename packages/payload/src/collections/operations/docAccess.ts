import type { SanitizedCollectionPermission } from '../../auth/index.js'
import type { AllOperations, JsonObject, PayloadRequest } from '../../types/index.js'
import type { Collection } from '../config/types.js'

import { getEntityPermissions } from '../../utilities/getEntityPermissions/getEntityPermissions.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { sanitizePermissions } from '../../utilities/sanitizePermissions.js'

const allOperations: AllOperations[] = ['create', 'read', 'update', 'delete']

type Arguments = {
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

export async function docAccessOperation(args: Arguments): Promise<SanitizedCollectionPermission> {
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
