import type { UpdateGlobal } from 'payload'

import type { MongooseAdapter } from './index.js'

import { buildProjectionFromSelect } from './utilities/buildProjectionFromSelect.js'
import { getSession } from './utilities/getSession.js'
import { transform } from './utilities/transform.js'

export const updateGlobal: UpdateGlobal = async function updateGlobal(
  this: MongooseAdapter,
  { slug, data, options: optionsArgs = {}, req, select },
) {
  const Model = this.globals
  const fields = this.payload.config.globals.find((global) => global.slug === slug).flattenedFields

  const session = await getSession(this, req)

  transform({
    adapter: this,
    data,
    fields,
    operation: 'update',
    timestamps: optionsArgs.timestamps !== false,
  })

  const result: any = await Model.collection.findOneAndUpdate(
    { globalType: slug },
    { $set: data },
    {
      ...optionsArgs,
      projection: buildProjectionFromSelect({ adapter: this, fields, select }),
      returnDocument: 'after',
      session,
    },
  )

  transform({
    adapter: this,
    data: result,
    fields,
    operation: 'read',
  })

  return result
}
