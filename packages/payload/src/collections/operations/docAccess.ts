import type { CollectionPermission } from '../../auth'
import type { PayloadRequest } from '../../types'
import type { AllOperations } from '../../types'
import type { Collection } from '../config/types'

import { commitTransaction } from '../../utilities/commitTransaction'
import { getEntityPolicies } from '../../utilities/getEntityPolicies'
import { initTransaction } from '../../utilities/initTransaction'
import { killTransaction } from '../../utilities/killTransaction'

const allOperations: AllOperations[] = ['create', 'read', 'update', 'delete']

type Arguments = {
  collection: Collection
  id: string
  req: PayloadRequest
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
      entity: config,
      operations: collectionOperations,
      req,
      type: 'collection',
    })

    if (shouldCommit) await commitTransaction(req)

    return result
  } catch (e: unknown) {
    await killTransaction(req)
    throw e
  }
}
