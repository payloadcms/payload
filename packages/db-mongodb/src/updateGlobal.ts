import type { UpdateGlobal } from 'payload/database'
import type { PayloadRequest } from 'payload/types'

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

  result = await Model.findOneAndUpdate({ globalType: slug }, data, options)

  result = this.jsonParse ? JSON.parse(JSON.stringify(result)) : result

  result = sanitizeInternalFields(result)

  return result
}
