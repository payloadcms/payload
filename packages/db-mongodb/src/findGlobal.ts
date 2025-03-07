import type { QueryOptions } from 'mongoose'
import type { FindGlobal } from 'payload'

import { combineQueries } from 'payload'

import type { MongooseAdapter } from './index.js'

import { buildQuery } from './queries/buildQuery.js'
import { buildProjectionFromSelect } from './utilities/buildProjectionFromSelect.js'
import { getGlobal } from './utilities/getEntity.js'
import { getSession } from './utilities/getSession.js'
import { transform } from './utilities/transform.js'

export const findGlobal: FindGlobal = async function findGlobal(
  this: MongooseAdapter,
  { slug: globalSlug, locale, req, select, where = {} },
) {
  const { globalConfig, Model } = getGlobal({ adapter: this, globalSlug })

  const fields = globalConfig.flattenedFields
  const options: QueryOptions = {
    lean: true,
    select: buildProjectionFromSelect({
      adapter: this,
      fields,
      select,
    }),
    session: await getSession(this, req),
  }

  const query = await buildQuery({
    adapter: this,
    fields,
    globalSlug,
    locale,
    where: combineQueries({ globalType: { equals: globalSlug } }, where),
  })

  const doc: any = await Model.findOne(query, {}, options)

  if (!doc) {
    return null
  }

  transform({
    adapter: this,
    data: doc,
    fields: globalConfig.fields,
    operation: 'read',
  })

  return doc
}
