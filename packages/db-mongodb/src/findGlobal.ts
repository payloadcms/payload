import type { QueryOptions } from 'mongoose'
import type { FindGlobal, PayloadRequest } from 'payload'

import { combineQueries } from 'payload'

import type { MongooseAdapter } from './index.js'

import { buildQueryWithAggregate } from './utilities/buildQueryWithAggregate.js'
import { sanitizeInternalFields } from './utilities/sanitizeInternalFields.js'
import { withSession } from './withSession.js'

export const findGlobal: FindGlobal = async function findGlobal(
  this: MongooseAdapter,
  { slug, locale, req = {} as PayloadRequest, where },
) {
  const Model = this.globals
  const options: QueryOptions = {
    ...(await withSession(this, req)),
    lean: true,
  }

  const query = await buildQueryWithAggregate({
    globalSlug: slug,
    locale,
    Model,
    payload: this.payload,
    session: options.session,
    where: combineQueries({ globalType: { equals: slug } }, where),
  })

  let doc = (await Model.findOne(query, {}, options)) as any

  if (!doc) {
    return null
  }
  if (doc._id) {
    doc.id = doc._id
    delete doc._id
  }

  doc = JSON.parse(JSON.stringify(doc))
  doc = sanitizeInternalFields(doc)

  return doc
}
