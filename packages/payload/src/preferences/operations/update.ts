import type { PreferenceUpdateRequest } from '../types.js'

import defaultAccess from '../../auth/defaultAccess.js'
import executeAccess from '../../auth/executeAccess.js'
import { UnauthorizedError } from '../../errors/UnathorizedError.js'

async function update(args: PreferenceUpdateRequest) {
  const {
    key,
    overrideAccess,
    req: { payload },
    req,
    user,
    value,
  } = args

  if (!user) {
    throw new UnauthorizedError(req.t)
  }

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

  if (!overrideAccess) {
    await executeAccess({ req }, defaultAccess)
  }

  const existingPreference = await payload.db.count({
    collection,
    req,
    where: filter,
  })

  if (existingPreference.totalDocs > 0) {
    await payload.db.updateOne({
      collection,
      data: preference,
      req,
      where: filter,
    })
  } else {
    await payload.db.create({
      collection,
      data: preference,
      req,
    })
  }

  return preference
}

export default update
