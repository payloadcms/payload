import type { Response } from 'express'

import httpStatus from 'http-status'

import type { Collection } from '../../collections/config/types'
import type { PayloadRequest } from '../../express/types'

import { APIError } from '../../errors'

export type Arguments = {
  collection: Collection
  req: PayloadRequest
  res: Response
}

async function logout(incomingArgs: Arguments): Promise<string> {
  let args = incomingArgs
  const {
    collection,
    collection: { config: collectionConfig },
    req,
    req: {
      payload: { config },
      user,
    },
    res,
  } = incomingArgs

  if (!user) throw new APIError('No User', httpStatus.BAD_REQUEST)
  if (user.collection !== collectionConfig.slug)
    throw new APIError('Incorrect collection', httpStatus.FORBIDDEN)

  const cookieOptions = {
    domain: undefined,
    httpOnly: true,
    path: '/',
    sameSite: collectionConfig.auth.cookies.sameSite,
    secure: collectionConfig.auth.cookies.secure,
  }

  if (collectionConfig.auth.cookies.domain)
    cookieOptions.domain = collectionConfig.auth.cookies.domain

  await collection.config.hooks.afterLogout.reduce(async (priorHook, hook) => {
    await priorHook

    args =
      (await hook({
        collection: args.collection?.config,
        context: req.context,
        req,
        res,
      })) || args
  }, Promise.resolve())

  res.clearCookie(`${config.cookiePrefix}-token`, cookieOptions)

  return req.t('authentication:loggedOutSuccessfully')
}

export default logout
