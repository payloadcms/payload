import type { SanitizedCollectionPermission } from '../../auth/index.js'
import type { AllOperations, PayloadRequest } from '../../types/index.js'
import type { Collection } from '../config/types.js'

import { getEntityPermissions } from '../../utilities/getEntityPermissions/getEntityPermissions.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { sanitizePermissions } from '../../utilities/sanitizePermissions.js'

const allOperations: AllOperations[] = ['create', 'read', 'update', 'delete']

type Arguments = {
  collection: Collection
  id: number | string
  req: PayloadRequest
}

export async function docAccessOperation(args: Arguments): Promise<SanitizedCollectionPermission> {
  const {
    id,
    collection: { config },
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
      id,
      blockReferencesPermissions: {},
      entity: config,
      entityType: 'collection',
      fetchData: true,
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
