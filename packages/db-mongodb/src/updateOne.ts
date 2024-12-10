import type { PayloadRequest, UpdateOne } from 'payload'

import type { MongooseAdapter } from './index.js'

import { getSession } from './getSession.js'
import { buildProjectionFromSelect } from './utilities/buildProjectionFromSelect.js'
import { handleError } from './utilities/handleError.js'
import { transform } from './utilities/transform.js'

export const updateOne: UpdateOne = async function updateOne(
  this: MongooseAdapter,
  {
    id,
    collection,
    data,
    locale,
    options: optionsArgs = {},
    req = {} as PayloadRequest,
    select,
    where: whereArg,
  },
) {
  const where = id ? { id: { equals: id } } : whereArg
  const Model = this.collections[collection]
  const fields = this.payload.collections[collection].config.flattenedFields

  const session = await getSession(this, req)

  const query = await Model.buildQuery({
    locale,
    payload: this.payload,
    session,
    where,
  })

  transform({
    adapter: this,
    data,
    fields,
    operation: 'update',
  })

  try {
    const result = await Model.collection.findOneAndUpdate(
      query,
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
  } catch (error) {
    handleError({ collection, error, req })
  }
}
