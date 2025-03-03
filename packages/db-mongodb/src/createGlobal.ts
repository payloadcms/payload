import type { CreateOptions } from 'mongoose'

import { type CreateGlobal } from 'payload'

import type { MongooseAdapter } from './index.js'

import { getGlobal } from './utilities/getEntity.js'
import { getSession } from './utilities/getSession.js'
import { transform } from './utilities/transform.js'

export const createGlobal: CreateGlobal = async function createGlobal(
  this: MongooseAdapter,
  { slug: globalSlug, data, req, returning },
) {
  const { globalConfig, Model } = getGlobal({ adapter: this, globalSlug })

  transform({
    adapter: this,
    data,
    fields: globalConfig.fields,
    globalSlug,
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
    fields: globalConfig.fields,
    operation: 'read',
  })

  return result
}
