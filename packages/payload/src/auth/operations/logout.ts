import { status as httpStatus } from 'http-status'

import type { Collection } from '../../collections/config/types.js'
import type { PayloadRequest } from '../../types/index.js'

import { APIError } from '../../errors/index.js'
import { appendNonTrashedFilter } from '../../utilities/appendNonTrashedFilter.js'
import { commitTransaction } from '../../utilities/commitTransaction.js'
import { initTransaction } from '../../utilities/initTransaction.js'
import { killTransaction } from '../../utilities/killTransaction.js'
import { removeExpiredSessions, revokeSession } from '../sessions.js'

export type Arguments = {
  allSessions?: boolean
  collection: Collection
  req: PayloadRequest
}

export const logoutOperation = async (incomingArgs: Arguments): Promise<boolean> => {
  let args = incomingArgs
  const {
    allSessions,
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

  const shouldCommit = await initTransaction(req)

  try {
    if (collectionConfig.hooks?.afterLogout?.length) {
      for (const hook of collectionConfig.hooks.afterLogout) {
        args =
          (await hook({
            collection: args.collection?.config,
            context: req.context,
            req,
          })) || args
      }
    }

    if (collectionConfig.auth.useSessions) {
      if (allSessions) {
        const where = appendNonTrashedFilter({
          enableTrash: Boolean(collectionConfig.trash),
          trash: false,
          where: {
            id: {
              equals: user.id,
            },
          },
        })

        const userWithSessions = await req.payload.db.findOne<{
          id: number | string
          sessions: { id: string }[]
        }>({
          collection: collectionConfig.slug,
          req,
          where,
        })

        if (!userWithSessions) {
          throw new APIError('No User', httpStatus.BAD_REQUEST)
        }

        userWithSessions.sessions = []

        // Prevent updatedAt from being updated when only removing sessions
        ;(userWithSessions as any).updatedAt = null

        await req.payload.db.updateOne({
          id: user.id,
          collection: collectionConfig.slug,
          data: userWithSessions,
          req,
          returning: false,
        })
      } else if (user._sid) {
        await revokeSession({
          collectionConfig,
          payload: req.payload,
          req,
          sid: user._sid,
          user,
        })
      }
    }

    if (shouldCommit) {
      await commitTransaction(req)
    }

    return true
  } catch (error: unknown) {
    await killTransaction(req)
    throw error
  }
}
