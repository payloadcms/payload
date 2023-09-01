import type { PreferenceUpdateRequest } from '../types'

import defaultAccess from '../../auth/defaultAccess'
import executeAccess from '../../auth/executeAccess'
import UnauthorizedError from '../../errors/UnathorizedError'

async function update(args: PreferenceUpdateRequest) {
  const {
    key,
    overrideAccess,
    req: { payload },
    req,
    user,
    value,
  } = args

  const collection = 'payload-preferences'

  const filter = {
    key: { equals: key },
    'user.relationTo': { equals: user.collection },
    'user.value': { equals: user.id },
  }

  const preference = {
    key,
    user: {
      relationTo: user.collection,
      value: user.id,
    },
    value,
  }

  if (!user) {
    throw new UnauthorizedError(req.t)
  }

  if (!overrideAccess) {
    await executeAccess({ req }, defaultAccess)
  }

  // TODO: workaround to prevent race-conditions 500 errors from violating unique constraints
  try {
    await payload.db.create({
      collection,
      data: preference,
      req,
    })
  } catch (err: unknown) {
    await payload.db.updateOne({
      collection,
      data: preference,
      req,
      where: filter,
    })
  }

  return preference
}

export default update
