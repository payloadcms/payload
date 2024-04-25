import type { CollectionPermission } from '../../auth/index.js'
import type { AllOperations, PayloadRequestWithData } from '../../types/index.js'
import type { Collection } from '../config/types.js'

import { commitTransaction } from '../../utilities/commitTransaction.js'
import { getEntityPolicies } from '../../utilities/getEntityPolicies.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { killTransaction } from '../../utilities/killTransaction.js'

const allOperations: AllOperations[] = ['create', 'read', 'update', 'delete']

type Arguments = {
  collection: Collection
  id: string
  req: PayloadRequestWithData
}

export async function docAccessOperation(args: Arguments): Promise<CollectionPermission> {
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
    const shouldCommit = await initTransaction(req)

    const result = await getEntityPolicies({
      id,
      type: 'collection',
      entity: config,
      operations: collectionOperations,
      req,
    })

    if (shouldCommit) await commitTransaction(req)

    return result
  } catch (e: unknown) {
    await killTransaction(req)
    throw e
  }
}
