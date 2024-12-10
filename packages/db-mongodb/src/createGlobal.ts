import type { CreateGlobal, PayloadRequest } from 'payload'

import type { MongooseAdapter } from './index.js'

import { sanitizeInternalFields } from './utilities/sanitizeInternalFields.js'
import { sanitizeRelationshipIDs } from './utilities/sanitizeRelationshipIDs.js'
import { withSession } from './withSession.js'

export const createGlobal: CreateGlobal = async function createGlobal(
  this: MongooseAdapter,
  { slug, data, req = {} as PayloadRequest },
) {
  const Model = this.globals

  const global = sanitizeRelationshipIDs({
    config: this.payload.config,
    data: {
      globalType: slug,
      ...data,
    },
    fields: this.payload.config.globals.find((globalConfig) => globalConfig.slug === slug).fields,
  })

  const options = await withSession(this, req)

  let [result] = (await Model.create([global], options)) as any

  result = JSON.parse(JSON.stringify(result))

  // custom id type reset
  result.id = result._id
  result = sanitizeInternalFields(result)

  return result
}
