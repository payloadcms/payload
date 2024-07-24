import type { FindGlobal } from 'payload/database'
import type { PayloadRequest } from 'payload/types'

import { combineQueries } from 'payload/database'

import type { MongooseAdapter } from '.'

import sanitizeInternalFields from './utilities/sanitizeInternalFields'
import { withSession } from './withSession'

export const findGlobal: FindGlobal = async function findGlobal(
  this: MongooseAdapter,
  { slug, locale, req = {} as PayloadRequest, where },
) {
  const Model = this.globals
  const options = {
    ...(await withSession(this, req)),
    lean: true,
  }

  const query = await Model.buildQuery({
    globalSlug: slug,
    locale,
    payload: this.payload,
    where: combineQueries({ globalType: { equals: slug } }, where),
  })

  let doc = (await Model.findOne(query, {}, options)) as any

  if (!doc) {
    return null
  }

  if (this.jsonParse) {
    doc = JSON.parse(JSON.stringify(doc))
  }

  if (doc._id) {
    doc.id = JSON.parse(JSON.stringify(doc._id))
    delete doc._id
  }

  doc = sanitizeInternalFields(doc)

  return doc
}
