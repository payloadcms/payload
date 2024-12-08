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

  const session = await getSession(this, req)

  const query = await VersionModel.buildQuery({
    locale,
    payload: this.payload,
    session,
    where: whereToUse,
  })

  transform({
    adapter: this,
    data: versionData,
    fields,
    operation: 'update',
  })

  const doc: any = await VersionModel.collection.findOneAndUpdate(
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
      session,
    },
  )

  transform({
    adapter: this,
    data: doc,
    fields,
    operation: 'read',
  })

  return doc
}
