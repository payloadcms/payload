import type { FindGlobal, PayloadRequest } from 'payload'

import { combineQueries } from 'payload'

import type { MongooseAdapter } from './index.js'

import { sanitizeDocument } from './utilities/sanitizeDocument.js'
import { withSession } from './withSession.js'

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

  const doc = (await Model.findOne(query, {}, options)) as any

  if (!doc) {
    return null
  }

  sanitizeDocument(doc)

  return doc
}
