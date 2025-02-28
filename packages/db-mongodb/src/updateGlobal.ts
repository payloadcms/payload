import type { MongooseUpdateQueryOptions } from 'mongoose'
import type { UpdateGlobal } from 'payload'

import type { MongooseAdapter } from './index.js'

import { buildProjectionFromSelect } from './utilities/buildProjectionFromSelect.js'
import { getSession } from './utilities/getSession.js'
import { transform } from './utilities/transform.js'

export const updateGlobal: UpdateGlobal = async function updateGlobal(
  this: MongooseAdapter,
  { slug, data, options: optionsArgs = {}, req, returning, select },
) {
  const Model = this.globals
  const fields = this.payload.config.globals.find((global) => global.slug === slug).fields

  const options: MongooseUpdateQueryOptions = {
    ...optionsArgs,
    lean: true,
    new: true,
    projection: buildProjectionFromSelect({
      adapter: this,
      fields: this.payload.config.globals.find((global) => global.slug === slug).flattenedFields,
      select,
    }),
    session: await getSession(this, req),
  }

  transform({ adapter: this, data, fields, globalSlug: slug, operation: 'write' })

  if (returning === false) {
    await Model.updateOne({ globalType: slug }, data, options)
    return null
  }

  const result: any = await Model.findOneAndUpdate({ globalType: slug }, data, options)

  transform({ adapter: this, data: result, fields, globalSlug: slug, operation: 'read' })

  return result
}
