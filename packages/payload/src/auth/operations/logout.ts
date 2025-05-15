import { status as httpStatus } from 'http-status'
import { decodeJwt } from 'jose'

import type { Collection } from '../../collections/config/types.js'
import type { PayloadRequest } from '../../types/index.js'

import { APIError } from '../../errors/index.js'
import { extractJWT } from '../extractJWT.js'

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

  const sessionsAfterLogout = ((user.sessions || []) as Array<{ id: string }>).filter(
    (s) => s.id !== decodedToken.sid,
  )
  req.payload.logger.info({
    allSessions: user.sessions,
    msg: 'Logging out and updating user',
    sessionIDFromToken: decodedToken.sid,
    sessionsAfterLogout,
  })

  const updatedUser = await req.payload.update({
    id: user.id,
    collection: collectionConfig.slug,
    data: {
      sessions: sessionsAfterLogout,
    },
  })

  req.payload.logger.info({
    msg: `Removed session ${decodedToken.sid as string} from user ${user.id}`,
    user: updatedUser,
  })

  return true
}
