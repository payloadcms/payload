import { status as httpStatus } from 'http-status'

import type { PayloadRequest } from '../../../types/index.js'

import { APIError } from '../../../errors/index.js'
import { commitTransaction } from '../../../utilities/commitTransaction.js'
import { initTransaction } from '../../../utilities/initTransaction.js'
import { killTransaction } from '../../../utilities/killTransaction.js'
import { createJSONResponse } from './createJSONResponse.js'

/**
 * Backfills missing order keys for collections that enabled orderable after
 * documents already existed.
 */
export async function runInitialOrderMigration(args: {
  collectionSlug: string
  orderableFieldName: string
  req: PayloadRequest
  where?: Record<string, unknown>
}): Promise<Response> {
  const { collectionSlug, orderableFieldName, req, where } = args

  const { docs } = await req.payload.find({
    collection: collectionSlug,
    depth: 0,
    limit: 0,
    req,
    select: { [orderableFieldName]: true },
    where: where || {
      [orderableFieldName]: {
        exists: false,
      },
    },
  })

  await initTransaction(req)

  // We cannot update all documents in a single operation with `payload.update`,
  // because they would all end up with the same order key (`a0`).
  try {
    for (const doc of docs) {
      await req.payload.update({
        id: doc.id,
        collection: collectionSlug,
        data: {
          // no data needed since the order hooks will handle this
        },
        depth: 0,
        req,
      })
      await commitTransaction(req)
    }
  } catch (error) {
    await killTransaction(req)
    if (error instanceof Error) {
      throw new APIError(error.message, httpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  return createJSONResponse({ message: 'initial migration', success: true }, 200)
}
