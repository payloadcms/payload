import type { CreateOptions } from 'mongoose'

import { type CreateGlobal } from '@ruya.sa/payload'

import type { MongooseAdapter } from './index.js'

import { getGlobal } from './utilities/getEntity.js'
import { getSession } from './utilities/getSession.js'
import { transform } from './utilities/transform.js'

export const createGlobal: CreateGlobal = async function createGlobal(
  this: MongooseAdapter,
  { slug: globalSlug, data, req, returning },
) {
  const { globalConfig, Model } = getGlobal({ adapter: this, globalSlug })

  if (!data.createdAt) {
    ;(data as any).createdAt = new Date().toISOString()
  }

  transform({
    adapter: this,
    data,
    fields: globalConfig.fields,
    globalSlug,
    operation: 'write',
  })

  const options: CreateOptions = {
    session: await getSession(this, req),
    // Timestamps are manually added by the write transform
    timestamps: false,
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
