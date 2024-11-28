import {
  buildVersionGlobalFields,
  type PayloadRequest,
  type TypeWithID,
  type UpdateGlobalVersionArgs,
} from 'payload'

import type { MongooseAdapter } from './index.js'

import { getSession } from './getSession.js'
import { buildProjectionFromSelect } from './utilities/buildProjectionFromSelect.js'
import { transform } from './utilities/transform.js'

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
  const fields = buildVersionGlobalFields(
    this.payload.config,
    this.payload.config.globals.find((global) => global.slug === globalSlug),
    true,
  )

  const query = await VersionModel.buildQuery({
    locale,
    payload: this.payload,
    where: whereToUse,
  })

  transform({
    type: 'write',
    adapter: this,
    data: versionData,
    fields,
  })

  const doc = await VersionModel.collection.findOneAndUpdate(
    query,
    { $set: versionData },
    {
      ...optionsArgs,
      projection: buildProjectionFromSelect({
        adapter: this,
        fields,
        select,
      }),
      returnDocument: 'after',
      session: await getSession(this, req),
    },
  )

  transform({
    type: 'read',
    adapter: this,
    data: doc,
    fields,
  })

  return doc
}
