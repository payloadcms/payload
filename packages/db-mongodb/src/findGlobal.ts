import type { QueryOptions } from 'mongoose'
import type { FindGlobal } from 'payload/database'
import type { PayloadRequestWithData } from 'payload/types'

import { combineQueries } from 'payload/database'

import type { MongooseAdapter } from './index.js'

import { buildProjection } from './queries/projection/buildProjection.js'
import sanitizeInternalFields from './utilities/sanitizeInternalFields.js'
import { withSession } from './withSession.js'

export const findGlobal: FindGlobal = async function findGlobal(
  this: MongooseAdapter,
  { slug, locale, req = {} as PayloadRequestWithData, select, where },
) {
  const Model = this.globals
  const globalConfig = this.payload.config.globals.find((each) => each.slug === slug)

  const options: QueryOptions = {
    ...withSession(this, req.transactionID),
    lean: true,
    projection: buildProjection({
      fields: globalConfig.fields,
      localeCodes:
        (this.payload.config.localization && this.payload.config.localization.localeCodes) || [],
      select,
    }),
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
  if (doc._id) {
    doc.id = doc._id
    delete doc._id
  }

  doc = JSON.parse(JSON.stringify(doc))
  doc = sanitizeInternalFields(doc)

  return doc
}
