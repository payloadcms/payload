import { status as httpStatus } from 'http-status'

import type { Collection } from '../../collections/config/types.js'
import type { PayloadRequest } from '../../types/index.js'

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

  if (!user) {
    throw new APIError('No User', httpStatus.BAD_REQUEST)
  }
  if (user.collection !== collectionConfig.slug) {
    throw new APIError('Incorrect collection', httpStatus.FORBIDDEN)
  }

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
