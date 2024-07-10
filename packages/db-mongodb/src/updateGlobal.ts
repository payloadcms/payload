import type { UpdateGlobal } from 'payload/database'
import type { PayloadRequest } from 'payload/types'

import { flatten } from 'flatley'

import type { MongooseAdapter } from '.'

import sanitizeInternalFields from './utilities/sanitizeInternalFields'
import { withSession } from './withSession'

export const updateGlobal: UpdateGlobal = async function updateGlobal(
  this: MongooseAdapter,
  { slug, data, req = {} as PayloadRequest },
) {
  const Model = this.globals
  const options = {
    ...(await withSession(this, req)),
    lean: true,
    new: true,
  }

  let result

  let dataToUse = data

  if (!this.strict) {
    dataToUse = flatten(data)
  }

  result = await Model.findOneAndUpdate({ globalType: slug }, dataToUse, options)

  result = JSON.parse(JSON.stringify(result))

  // custom id type reset
  result.id = result._id
  result = sanitizeInternalFields(result)

  return result
}
