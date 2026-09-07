import type { QueryFilter, QueryOptions } from 'mongoose'
import type { UpdateGlobal } from 'payload'

import type { MongooseAdapter } from './index.js'

import { buildQuery } from './queries/buildQuery.js'
import { buildProjectionFromSelect } from './utilities/buildProjectionFromSelect.js'
import { getGlobal } from './utilities/getEntity.js'
import { getSession } from './utilities/getSession.js'
import { transform } from './utilities/transform.js'

export const updateGlobal: UpdateGlobal = async function updateGlobal(
  this: MongooseAdapter,
  { slug: globalSlug, data, options: optionsArgs = {}, req, returning, select, where },
) {
  const { globalConfig, Model } = getGlobal({ adapter: this, globalSlug })

  const fields = globalConfig.fields
  const query: QueryFilter<Record<string, unknown>> = {
    globalType: globalSlug,
  }

  if (where) {
    query.$and = [
      await buildQuery({
        adapter: this,
        fields: globalConfig.flattenedFields,
        globalSlug,
        locale: req?.locale ?? undefined,
        where,
      }),
    ]
  }

  transform({ adapter: this, data, fields, globalSlug, operation: 'write' })

  const baseOptions = {
    ...optionsArgs,
    /**
     * Without where: if a global does not exist yet, we should create it here.
     * The user should always expect it exists and can be written to.
     *
     * With where: do not create it if condition doesn't match. No expectation that
     * a global fulfilling this condition should exist.
     */
    ...(where ? { upsert: false } : {}),
    session: await getSession(this, req),
    // Timestamps are manually added by the write transform
    timestamps: false,
  } satisfies QueryOptions

  const findOptions: QueryOptions = {
    ...baseOptions,
    lean: true,
    new: true,
    projection: buildProjectionFromSelect({
      adapter: this,
      fields: globalConfig.flattenedFields,
      select,
    }),
  }

  if (returning === false) {
    await Model.updateOne(query, data, baseOptions)
    return null
  }

  const result: any = await Model.findOneAndUpdate(query, data, findOptions)

  transform({ adapter: this, data: result, fields, globalSlug, operation: 'read' })

  return result
}
