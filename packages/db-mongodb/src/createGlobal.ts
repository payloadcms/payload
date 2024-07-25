import type { CreateGlobal } from 'payload/database'
import type { PayloadRequest } from 'payload/types'

import type { MongooseAdapter } from '.'

import sanitizeInternalFields from './utilities/sanitizeInternalFields'
import { withSession } from './withSession'

export const createGlobal: CreateGlobal = async function createGlobal(
  this: MongooseAdapter,
  { slug, data, req = {} as PayloadRequest },
) {
  const Model = this.globals
  const global = {
    globalType: slug,
    ...data,
  }
  const options = await withSession(this, req)

  let [result] = (await Model.create([global], options)) as any

  result = this.jsonParse ? JSON.parse(JSON.stringify(result)) : result.toObject()

  result = sanitizeInternalFields(result)

  return result
}
