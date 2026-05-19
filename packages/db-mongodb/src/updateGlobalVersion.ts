import type { QueryOptions } from 'mongoose'
import type { JsonObject, UpdateGlobalVersionArgs } from 'payload'

import { buildVersionGlobalFields } from 'payload'

import type { MongooseAdapter } from './index.js'

import { buildQuery } from './queries/buildQuery.js'
import { buildProjectionFromSelect } from './utilities/buildProjectionFromSelect.js'
import { getGlobal } from './utilities/getEntity.js'
import { getSession } from './utilities/getSession.js'
import { transform } from './utilities/transform.js'

export async function updateGlobalVersion<T extends JsonObject = JsonObject>(
  this: MongooseAdapter,
  {
    id,
    global: globalSlug,
    locale,
    options: optionsArgs = {},
    req,
    returning,
    select,
    versionData,
    where,
  }: UpdateGlobalVersionArgs<T>,
) {
  const { globalConfig, Model } = getGlobal({ adapter: this, globalSlug, versions: true })
  const whereToUse = where || { id: { equals: id } }

  const fields = buildVersionGlobalFields(this.payload.config, globalConfig)
  const flattenedFields = buildVersionGlobalFields(this.payload.config, globalConfig, true)

  const query = await buildQuery({
    adapter: this,
    fields: flattenedFields,
    locale,
    where: whereToUse,
  })

  transform({ adapter: this, data: versionData, fields, operation: 'write' })

  const baseOptions = {
    ...optionsArgs,
    session: await getSession(this, req),
    // Timestamps are manually added by the write transform
    timestamps: false,
  } satisfies QueryOptions

  const findOptions = {
    ...baseOptions,
    lean: true,
    new: true,
    projection: buildProjectionFromSelect({
      adapter: this,
      fields: flattenedFields,
      select,
    }),
  } satisfies QueryOptions

  if (returning === false) {
    await Model.updateOne(query, versionData, baseOptions)
    return null
  }

  const doc = await Model.findOneAndUpdate(query, versionData, findOptions)

  if (!doc) {
    return null
  }

  transform({ adapter: this, data: doc, fields, operation: 'read' })

  return doc
}
