import type { MongooseUpdateQueryOptions } from 'mongoose'
import type { UpdateGlobal } from 'payload'

import type { MongooseAdapter } from './index.js'

import { buildProjectionFromSelect } from './utilities/buildProjectionFromSelect.js'
import { getGlobal } from './utilities/getEntity.js'
import { getSession } from './utilities/getSession.js'
import { transform } from './utilities/transform.js'

export const updateGlobal: UpdateGlobal = async function updateGlobal(
  this: MongooseAdapter,
  { slug: globalSlug, data, options: optionsArgs = {}, req, returning, select },
) {
  const { globalConfig, Model } = getGlobal({ adapter: this, globalSlug })

  const fields = globalConfig.fields

  const options: MongooseUpdateQueryOptions = {
    ...optionsArgs,
    lean: true,
    new: true,
    projection: buildProjectionFromSelect({
      adapter: this,
      fields: globalConfig.flattenedFields,
      select,
    }),
    session: await getSession(this, req),
  }

  transform({ adapter: this, data, fields, globalSlug, operation: 'write' })

  if (returning === false) {
    await Model.updateOne({ globalType: globalSlug }, data, options)
    return null
  }

  const result: any = await Model.findOneAndUpdate({ globalType: globalSlug }, data, options)

  transform({ adapter: this, data: result, fields, globalSlug, operation: 'read' })

  return result
}
