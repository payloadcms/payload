import type { CreateOptions } from 'mongoose'
import type { CreateGlobal } from 'payload'

import type { MongooseAdapter } from './index.js'

import { getSession } from './utilities/getSession.js'
import { transform } from './utilities/transform.js'

export const createGlobal: CreateGlobal = async function createGlobal(
  this: MongooseAdapter,
  { slug, data, req, returning },
) {
  const Model = this.globals

  transform({
    adapter: this,
    data,
    fields: this.payload.config.globals.find((globalConfig) => globalConfig.slug === slug).fields,
    globalSlug: slug,
    operation: 'write',
  })

  const options: CreateOptions = {
    session: await getSession(this, req),
  }

  let [result] = (await Model.create([data], options)) as any
  if (returning === false) {
    return null
  }

  result = result.toObject()

  transform({
    adapter: this,
    data: result,
    fields: this.payload.config.globals.find((globalConfig) => globalConfig.slug === slug).fields,
    operation: 'read',
  })

  return result
}
