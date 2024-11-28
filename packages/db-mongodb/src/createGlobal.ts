import type { CreateGlobal, PayloadRequest } from 'payload'

import type { MongooseAdapter } from './index.js'

import { getSession } from './getSession.js'
import { transform } from './utilities/transform.js'

export const createGlobal: CreateGlobal = async function createGlobal(
  this: MongooseAdapter,
  { slug, data, req = {} as PayloadRequest },
) {
  const Model = this.globals

  const fields = this.payload.config.globals.find(
    (globalConfig) => globalConfig.slug === slug,
  ).flattenedFields

  transform({
    type: 'write',
    adapter: this,
    data,
    fields,
    globalSlug: slug,
    insert: true,
  })

  const session = await getSession(this, req)

  const { insertedId } = await Model.collection.insertOne(data, { session })
  ;(data as any)._id = insertedId

  transform({
    type: 'read',
    adapter: this,
    data,
    fields,
  })

  return data
}
