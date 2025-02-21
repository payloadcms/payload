import type { QueryOptions } from 'mongoose'
import type { FindGlobal } from 'payload'

import { combineQueries } from 'payload'

import type { MongooseAdapter } from './index.js'

import { buildQuery } from './queries/buildQuery.js'
import { buildProjectionFromSelect } from './utilities/buildProjectionFromSelect.js'
import { getSession } from './utilities/getSession.js'
import { transform } from './utilities/transform.js'

export const findGlobal: FindGlobal = async function findGlobal(
  this: MongooseAdapter,
  { slug, locale, req, select, where },
) {
  const Model = this.globals
  const globalConfig = this.payload.globals.config.find((each) => each.slug === slug)
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
    globalSlug: slug,
    locale,
    where: combineQueries({ globalType: { equals: slug } }, where),
  })

  const doc = (await Model.findOne(query, {}, options)) as any

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
