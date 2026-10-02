import type { QueryOptions } from 'mongoose'
import type { UpdateGlobal, UpdateGlobalArgs } from 'payload'

import { resolveBranchGlobalWrite } from 'payload'

import type { MongooseAdapter } from './index.js'

import { buildProjectionFromSelect } from './utilities/buildProjectionFromSelect.js'
import { getGlobal } from './utilities/getEntity.js'
import { getSession } from './utilities/getSession.js'
import { transform } from './utilities/transform.js'

type BranchUpdateGlobalArgs = {
  branchConflictData?: Record<string, unknown>
} & UpdateGlobalArgs

export const updateGlobal: UpdateGlobal = async function updateGlobal(this: MongooseAdapter, args) {
  const {
    slug: globalSlug,
    branch,
    branchConflictData,
    data,
    options: optionsArgs = {},
    req,
    returning,
    select,
  } = args as BranchUpdateGlobalArgs
  const { globalConfig, Model } = getGlobal({ adapter: this, globalSlug })

  const fields = globalConfig.fields

  transform({ adapter: this, data, fields, globalSlug, operation: 'write' })
  if (branchConflictData) {
    transform({ adapter: this, data: branchConflictData, fields, globalSlug, operation: 'write' })
  }

  const baseOptions = {
    ...optionsArgs,
    session: await getSession(this, req),
    // Timestamps are manually added by the write transform
    timestamps: false,
  } satisfies QueryOptions

  const findOptions: QueryOptions = {
    ...baseOptions,
    lean: true,
    projection: buildProjectionFromSelect({
      adapter: this,
      fields: globalConfig.flattenedFields,
      select,
    }),
    returnDocument: 'after',
  }

  const writeBranch = resolveBranchGlobalWrite({ branch, globalSlug, req })
  const isBranchableGlobal = this.payload.config.branching?.branchableGlobals.has(globalSlug)

  // On a branch the write targets that branch's own row, upserting it from
  // main's current content the first time the global is touched.
  const filter = writeBranch
    ? { _branch: { $eq: writeBranch }, globalType: globalSlug }
    : isBranchableGlobal
      ? { _branch: { $eq: 'main' }, globalType: globalSlug }
      : { globalType: globalSlug }

  if (writeBranch) {
    const mainDoc: any = await Model.findOne(
      { _branch: { $eq: 'main' }, globalType: globalSlug },
      {},
      baseOptions,
    ).lean()
    const { _id, __v, ...mainData } = (mainDoc ?? {}) as Record<string, unknown>
    const writeData = { ...((branchConflictData ?? data) as object), _branch: writeBranch }
    const insertData: Record<string, unknown> = { ...mainData, globalType: globalSlug }

    for (const key of Object.keys(writeData)) {
      delete insertData[key]
    }

    const upsertOptions = { ...findOptions, upsert: true }
    const update = { $set: writeData, $setOnInsert: insertData }

    if (returning === false) {
      await Model.findOneAndUpdate(filter, update, { ...baseOptions, upsert: true })
      return null
    }

    const result: any = await Model.findOneAndUpdate(filter, update, upsertOptions)

    transform({ adapter: this, data: result, fields, globalSlug, operation: 'read' })

    return result
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
