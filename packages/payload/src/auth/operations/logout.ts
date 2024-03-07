import httpStatus from 'http-status'

import type { Collection } from '../../collections/config/types.d.ts'
import type { PayloadRequest } from '../../types/index.d.ts'

import { APIError } from '../../errors/index.js'

export type Arguments = {
  collection: Collection
  req: PayloadRequest
}

export const logoutOperation = async (incomingArgs: Arguments): Promise<boolean> => {
  let args = incomingArgs
  const {
    collection: { config: collectionConfig },
    req: { user },
    req,
  } = incomingArgs

  if (!user) throw new APIError('No User', httpStatus.BAD_REQUEST)
  if (user.collection !== collectionConfig.slug)
    throw new APIError('Incorrect collection', httpStatus.INTERNAL_SERVER_ERROR)

  await collectionConfig.hooks.afterLogout.reduce(async (priorHook, hook) => {
    await priorHook

    args =
      (await hook({
        collection: args.collection?.config,
        context: req.context,
        req,
      })) || args
  }, Promise.resolve())

  return true
}
