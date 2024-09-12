import type { Collection } from '../../collections/config/types'
import type { PayloadRequest } from '../../express/types'

import { APIError } from '../../errors'
import { commitTransaction } from '../../utilities/commitTransaction'
import { initTransaction } from '../../utilities/initTransaction'
import { killTransaction } from '../../utilities/killTransaction'
import executeAccess from '../executeAccess'
import { resetLoginAttempts } from '../strategies/local/resetLoginAttempts'

export type Args = {
  collection: Collection
  data: {
    email: string
  }
  overrideAccess?: boolean
  req: PayloadRequest
}

async function unlock(args: Args): Promise<boolean> {
  if (!Object.prototype.hasOwnProperty.call(args.data, 'email')) {
    throw new APIError('Missing email.')
  }

  const {
    collection: { config: collectionConfig },
    overrideAccess,
    req: { locale, payload },
    req,
  } = args

  try {
    const shouldCommit = await initTransaction(req)

    // /////////////////////////////////////
    // Access
    // /////////////////////////////////////

    if (!overrideAccess) {
      await executeAccess({ req }, collectionConfig.access.unlock)
    }

    const options = { ...args }

    const { data } = options

    // /////////////////////////////////////
    // Unlock
    // /////////////////////////////////////

    if (!data.email) {
      throw new APIError('Missing email.')
    }

    const userDbArgs = {
      collection: collectionConfig.slug,
      locale,
      req,
      where: { email: { equals: data.email.toLowerCase() } },
    }

    let user: any
    if (collectionConfig?.db?.findOne) {
      user = await collectionConfig.db.findOne<any>(userDbArgs)
    } else {
      user = await req.payload.db.findOne<any>(userDbArgs)
    }

    let result

    if (user) {
      await resetLoginAttempts({
        collection: collectionConfig,
        doc: user,
        payload: req.payload,
        req,
      })
      result = true
    } else {
      result = null
    }

    if (shouldCommit) await commitTransaction(req)

    return result
  } catch (error: unknown) {
    await killTransaction(req)
    throw error
  }
}

export default unlock
