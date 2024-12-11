import type { QueryOptions } from 'mongoose'

import {
  buildVersionGlobalFields,
  type PayloadRequest,
  type TypeWithID,
  type UpdateGlobalVersionArgs,
} from 'payload'

import type { MongooseAdapter } from './index.js'

import { buildProjectionFromSelect } from './utilities/buildProjectionFromSelect.js'
import { sanitizeRelationshipIDs } from './utilities/sanitizeRelationshipIDs.js'
import { withSession } from './withSession.js'

export async function updateGlobalVersion<T extends TypeWithID>(
  this: MongooseAdapter,
  {
    id,
    global: globalSlug,
    locale,
    options: optionsArgs = {},
    req = {} as PayloadRequest,
    select,
    versionData,
    where,
  }: UpdateGlobalVersionArgs<T>,
) {
  const VersionModel = this.versions[globalSlug]
  const whereToUse = where || { id: { equals: id } }

  const currentGlobal = this.payload.config.globals.find((global) => global.slug === globalSlug)
  const fields = buildVersionGlobalFields(this.payload.config, currentGlobal)

  const options: QueryOptions = {
    ...optionsArgs,
    ...(await withSession(this, req)),
    lean: true,
    new: true,
    projection: buildProjectionFromSelect({
      adapter: this,
      fields: buildVersionGlobalFields(this.payload.config, currentGlobal, true),
      select,
    }),
  }

  const query = await VersionModel.buildQuery({
    locale,
    payload: this.payload,
    session: options.session,
    where: whereToUse,
  })

  const sanitizedData = sanitizeRelationshipIDs({
    config: this.payload.config,
    data: versionData,
    fields,
  })

  const doc = await VersionModel.findOneAndUpdate(query, sanitizedData, options)

  const result = JSON.parse(JSON.stringify(doc))

  const verificationToken = doc._verificationToken

  // custom id type reset
  result.id = result._id
  if (verificationToken) {
    result._verificationToken = verificationToken
  }
  return result
}
