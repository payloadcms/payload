import type { QueryOptions } from 'mongoose'

import { buildVersionGlobalFields, type TypeWithID, type UpdateGlobalVersionArgs } from 'payload'

import type { MongooseAdapter } from './index.js'

import { buildQuery } from './queries/buildQuery.js'
import { buildProjectionFromSelect } from './utilities/buildProjectionFromSelect.js'
import { getSession } from './utilities/getSession.js'
import { transform } from './utilities/transform.js'

export async function updateGlobalVersion<T extends TypeWithID>(
  this: MongooseAdapter,
  {
    id,
    global: globalSlug,
    locale,
    options: optionsArgs = {},
    req,
    select,
    versionData,
    where,
  }: UpdateGlobalVersionArgs<T>,
) {
  const VersionModel = this.versions[globalSlug]
  const whereToUse = where || { id: { equals: id } }

  const currentGlobal = this.payload.config.globals.find((global) => global.slug === globalSlug)
  const fields = buildVersionGlobalFields(this.payload.config, currentGlobal)
  const flattenedFields = buildVersionGlobalFields(this.payload.config, currentGlobal, true)
  const options: QueryOptions = {
    ...optionsArgs,
    lean: true,
    new: true,
    projection: buildProjectionFromSelect({
      adapter: this,
      fields: flattenedFields,
      select,
    }),
    session: await getSession(this, req),
  }

  const query = await buildQuery({
    adapter: this,
    fields: flattenedFields,
    locale,
    where: whereToUse,
  })

  transform({ adapter: this, data: versionData, fields, operation: 'write' })

  const doc = await VersionModel.findOneAndUpdate(query, versionData, options)

  if (!doc) {
    return null
  }

  transform({ adapter: this, data: doc, fields, operation: 'read' })

  return doc
}
