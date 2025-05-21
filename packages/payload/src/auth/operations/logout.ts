import { status as httpStatus } from 'http-status'
import { decodeJwt } from 'jose'

import type { Collection } from '../../collections/config/types.js'
import type { PayloadRequest } from '../../types/index.js'

import { APIError } from '../../errors/index.js'
import { extractJWT } from '../extractJWT.js'

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

  const token = extractJWT(req)
  const decodedToken = token ? decodeJwt(token) : undefined
  if (!decodedToken) {
    throw new APIError('Invalid token', httpStatus.INTERNAL_SERVER_ERROR)
  }

  if (collectionConfig.auth.disableLocalStrategy !== true && collectionConfig.auth.useSessions) {
    const userWithSessions = await req.payload.db.findOne<{
      id: number | string
      sessions: { id: string }[]
    }>({
      collection: collectionConfig.slug,
      req,
      where: {
        id: {
          equals: user.id,
        },
      },
    })

    if (allSessions) {
      userWithSessions.sessions = []
    } else {
      const sessionsAfterLogout = (userWithSessions?.sessions || []).filter(
        (s) => s.id !== decodedToken.sid,
      )

      userWithSessions.sessions = sessionsAfterLogout
    }

    await req.payload.db.updateOne({
      id: user.id,
      collection: collectionConfig.slug,
      data: userWithSessions,
    })
  }

  return true
}
