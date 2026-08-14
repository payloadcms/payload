import type { QueryOptions } from 'mongoose'
import type { UpdateGlobal } from 'payload'

import { recordBranchGlobalChange, resolveBranchGlobalWrite } from 'payload'

import type { MongooseAdapter } from './index.js'

import { buildProjectionFromSelect } from './utilities/buildProjectionFromSelect.js'
import { getGlobal } from './utilities/getEntity.js'
import { getSession } from './utilities/getSession.js'
import { transform } from './utilities/transform.js'

export const updateGlobal: UpdateGlobal = async function updateGlobal(
  this: MongooseAdapter,
  { slug: globalSlug, branch, data, options: optionsArgs = {}, req, returning, select },
) {
  const { globalConfig, Model } = getGlobal({ adapter: this, globalSlug })

  const fields = globalConfig.fields

  transform({ adapter: this, data, fields, globalSlug, operation: 'write' })

  const baseOptions = {
    ...optionsArgs,
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

  const writeBranch = resolveBranchGlobalWrite({ branch, globalSlug, req })

  // On a branch the write targets that branch's own row, upserting it from
  // main's current content the first time the global is touched.
  const filter = writeBranch
    ? { _branch: { $eq: writeBranch }, globalType: globalSlug }
    : { globalType: globalSlug }

  if (writeBranch) {
    const existing = await Model.findOne(filter, {}, baseOptions).lean()

    if (!existing) {
      const mainDoc: any = await Model.findOne(
        { _branch: { $eq: 'main' }, globalType: globalSlug },
        {},
        baseOptions,
      ).lean()
      const { _id, __v, ...mainData } = (mainDoc ?? {}) as Record<string, unknown>

      // Two arguments, as every other create in this adapter does since Mongoose 9 — the
      // session travels in the options, and a third argument selects a different overload.
      await Model.create([{ ...mainData, ...data, _branch: writeBranch }] as never, baseOptions)
      await recordBranchGlobalChange({ branch: writeBranch, globalSlug, req })

      if (returning === false) {
        return null
      }

      const created: any = await Model.findOne(filter, findOptions.projection, findOptions)

      transform({ adapter: this, data: created, fields, globalSlug, operation: 'read' })

      return created
    }

    await recordBranchGlobalChange({ branch: writeBranch, globalSlug, req })
  }

  // `_branch` is forced rather than taken from `data`. The incoming document is a
  // round-trip of a read, and `_branch` is stripped from reads — so the field's
  // `main` default silently refills it, and writing that back would flip the
  // branch's row onto main and leave two rows claiming to be production.
  const writeData = writeBranch ? { ...(data as object), _branch: writeBranch } : data

  if (returning === false) {
    await Model.updateOne(filter, writeData, baseOptions)
    return null
  }

  const result: any = await Model.findOneAndUpdate(filter, writeData, findOptions)

  transform({ adapter: this, data: result, fields, globalSlug, operation: 'read' })

  return result
}
