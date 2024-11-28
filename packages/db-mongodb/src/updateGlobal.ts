import type { PayloadRequest, UpdateGlobal } from 'payload'

import type { MongooseAdapter } from './index.js'

import { getSession } from './getSession.js'
import { buildProjectionFromSelect } from './utilities/buildProjectionFromSelect.js'
import { transform } from './utilities/transform.js'

export const updateGlobal: UpdateGlobal = async function updateGlobal(
  this: MongooseAdapter,
  { slug, data, options: optionsArgs = {}, req = {} as PayloadRequest, select },
) {
  const Model = this.globals
  const fields = this.payload.config.globals.find((global) => global.slug === slug).flattenedFields

  const session = await getSession(this, req)

  transform({ adapter: this, data, fields, operation: 'update' })

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
