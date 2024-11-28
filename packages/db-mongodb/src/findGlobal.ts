import type { FindGlobal, PayloadRequest } from 'payload'

import { combineQueries } from 'payload'

import type { MongooseAdapter } from './index.js'

import { getSession } from './getSession.js'
import { buildProjectionFromSelect } from './utilities/buildProjectionFromSelect.js'
import { transform } from './utilities/transform.js'

export const findGlobal: FindGlobal = async function findGlobal(
  this: MongooseAdapter,
  { slug, locale, req = {} as PayloadRequest, select, where },
) {
  const Model = this.globals

  const session = await getSession(this, req)

  const query = await Model.buildQuery({
    globalSlug: slug,
    locale,
    payload: this.payload,
    session,
    where: combineQueries({ globalType: { equals: slug } }, where),
  })

  const fields = this.payload.globals.config.find((each) => each.slug === slug).flattenedFields

  const doc = await Model.collection.findOne(query, {
    projection: buildProjectionFromSelect({
      adapter: this,
      fields,
      select,
    }),
    session: await getSession(this, req),
  })

  if (!doc) {
    return null
  }

  transform({ adapter: this, data: doc, fields, operation: 'read' })

  return doc as any
}
