import type { Validate } from '../fields/config/types.js'

import { createLocalReq } from '../utilities/createLocalReq.js'
import { getEntityPolicies } from '../utilities/getEntityPolicies.js'
import { initTransaction } from '../utilities/initTransaction.js'
import { killTransaction } from '../utilities/killTransaction.js'
import { queryPresetsCollectionSlug } from './config.js'

export const preventLockout: Validate = async (
  value,
  { data, overrideAccess, req: incomingReq },
) => {
  // Use context to ensure an infinite loop doesn't occur
  if (!incomingReq.context.isValidationReq && !overrideAccess) {
    const req = await createLocalReq(
      {
        context: {
          isValidationReq: true,
        },
        req: {
          user: incomingReq.user,
        },
      },
      incomingReq.payload,
    )

    // Might be `null` if no transactions are enabled
    const transactionID = await initTransaction(req)

    // create a temp record to validate the constraints, using the req
    const tempPreset = await req.payload.create({
      collection: queryPresetsCollectionSlug,
      data: {
        ...data,
        isTemp: true,
      },
      req,
    })

    const entityPolicies = await getEntityPolicies({
      id: tempPreset.id,
      type: 'collection',
      blockPolicies: {},
      entity: req.payload.collections[queryPresetsCollectionSlug].config,
      operations: ['read', 'update', 'delete'],
      req,
    })

    if (transactionID) {
      await killTransaction(req)
    } else {
      // delete the temp record
      await req.payload.delete({
        id: tempPreset.id,
        collection: queryPresetsCollectionSlug,
        req,
      })
    }

    for (const [operation, permission] of Object.entries({
      delete: entityPolicies.delete.permission,
      read: entityPolicies.read.permission,
      update: entityPolicies.update.permission,
    })) {
      if (!permission) {
        return `This operation would prevent you from having access to ${operation} this preset. Please update the constraints to allow yourself access.`
      }
    }
  }

  return true as unknown as true
}
